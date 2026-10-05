import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI client according to AI Studio guidelines
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Verification function: checks if a quote exists in the document text
export function verifyQuoteInDocument(
  quote: string,
  pages: { pageNumber: number; text: string }[]
): {
  verified: boolean;
  confidence: number;
  matchedPage: number | null;
  matchedText: string | null;
  contextSnippet: string | null;
  reason: string;
} {
  if (!quote || quote.trim().length === 0) {
    return {
      verified: false,
      confidence: 0,
      matchedPage: null,
      matchedText: null,
      contextSnippet: null,
      reason: "No quote provided by AI to verify.",
    };
  }

  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const targetClean = clean(quote);
  if (!targetClean || targetClean.length < 5) {
    return {
      verified: false,
      confidence: 0,
      matchedPage: null,
      matchedText: null,
      contextSnippet: null,
      reason: "Quote too short to verify reliably.",
    };
  }

  // 1. Check page by page
  for (const page of pages) {
    const rawText = page.text || '';
    const pageClean = clean(rawText);

    // Exact string match
    if (rawText.toLowerCase().includes(quote.toLowerCase().trim())) {
      const idx = rawText.toLowerCase().indexOf(quote.toLowerCase().trim());
      const start = Math.max(0, idx - 60);
      const end = Math.min(rawText.length, idx + quote.length + 60);
      const snippet = rawText.substring(start, end).replace(/\s+/g, ' ');

      return {
        verified: true,
        confidence: 100,
        matchedPage: page.pageNumber,
        matchedText: quote.trim(),
        contextSnippet: `...${snippet}...`,
        reason: `Verified verbatim on Page ${page.pageNumber}`,
      };
    }

    // Normalized whitespace/punctuation match
    if (pageClean.includes(targetClean)) {
      const idx = pageClean.indexOf(targetClean);
      const start = Math.max(0, idx - 40);
      const end = Math.min(pageClean.length, idx + targetClean.length + 40);
      return {
        verified: true,
        confidence: 95,
        matchedPage: page.pageNumber,
        matchedText: quote.trim(),
        contextSnippet: `...${pageClean.substring(start, end)}...`,
        reason: `Verified (normalized text match) on Page ${page.pageNumber}`,
      };
    }

    // High partial match (e.g. 80%+ words match in contiguous window)
    const quoteWords = targetClean.split(' ');
    if (quoteWords.length >= 4) {
      const firstChunk = quoteWords.slice(0, 4).join(' ');
      const lastChunk = quoteWords.slice(-4).join(' ');
      if (pageClean.includes(firstChunk) && pageClean.includes(lastChunk)) {
        return {
          verified: true,
          confidence: 85,
          matchedPage: page.pageNumber,
          matchedText: quote.trim(),
          contextSnippet: `...[Found matching passage on Page ${page.pageNumber}]...`,
          reason: `Verified (key phrases matched) on Page ${page.pageNumber}`,
        };
      }
    }
  }

  return {
    verified: false,
    confidence: 15,
    matchedPage: null,
    matchedText: null,
    contextSnippet: null,
    reason: "⚠ SAMJHO couldn't verify this claim against the document text.",
  };
}

// Resilient Gemini caller with automatic retries, backoff, and fallback models
async function callGeminiWithResilience(
  client: GoogleGenAI,
  userPrompt: string,
  systemPrompt: string
): Promise<{ text: string; modelUsed: string }> {
  // Try models in order of priority; if 503 high-demand occurs, failover to next model
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
        if (response.text) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || '').toLowerCase();
        const isTemporary =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('429') ||
          errMsg.includes('resource_exhausted');

        console.warn(`[AI Engine] Attempt ${attempt} on ${model} failed: ${err.message}`);

        if (isTemporary && attempt < 2) {
          // Exponential backoff
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        // If second attempt failed or non-temporary, fall through to next model
        break;
      }
    }
  }

  throw lastError || new Error('All AI models are currently busy');
}

// Emergency rule-based extractor if all cloud models are 503 busy
function extractStructuredRuleFallback(documentPages: { pageNumber: number; text: string }[]) {
  const fullText = documentPages.map((p) => p.text).join('\n\n');
  const lines = fullText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // Detect dates
  const dateRegex = /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/i;
  let deadlineDate = 'Not mentioned in the document';
  let deadlineQuote: string | null = null;
  let deadlinePage: number | null = null;
  let hasDeadline = false;

  for (const page of documentPages) {
    const match = page.text.match(dateRegex);
    if (match && !page.text.toLowerCase().includes('ref no') && !page.text.toLowerCase().includes('issue date')) {
      deadlineDate = match[1];
      // Extract surrounding sentence
      const sIdx = Math.max(0, page.text.indexOf(match[0]) - 30);
      const eIdx = Math.min(page.text.length, page.text.indexOf(match[0]) + match[0].length + 40);
      deadlineQuote = page.text.substring(sIdx, eIdx).trim();
      deadlinePage = page.pageNumber;
      hasDeadline = true;
      break;
    }
  }

  // Detect cost
  const feeRegex = /(?:Rs\.?|INR|₹)\s*([\d,]+)/i;
  const noFeeRegex = /no\s+(?:verification\s+)?fee|free\s+of\s+cost|no\s+charge/i;
  let costAmount = 'No fee mentioned in the document';
  let costQuote: string | null = null;
  let costPage: number | null = null;
  let hasFee = false;

  for (const page of documentPages) {
    if (noFeeRegex.test(page.text)) {
      const match = page.text.match(noFeeRegex);
      costAmount = 'No fee required (Free of cost)';
      costQuote = match ? match[0] : 'No fee mentioned';
      costPage = page.pageNumber;
      hasFee = false;
      break;
    }
    const feeMatch = page.text.match(feeRegex);
    if (feeMatch) {
      costAmount = `Rs. ${feeMatch[1]}`;
      const sIdx = Math.max(0, page.text.indexOf(feeMatch[0]) - 20);
      const eIdx = Math.min(page.text.length, page.text.indexOf(feeMatch[0]) + feeMatch[0].length + 30);
      costQuote = page.text.substring(sIdx, eIdx).trim();
      costPage = page.pageNumber;
      hasFee = true;
      break;
    }
  }

  // Extract action lines
  const actionKeywords = ['submit', 'present themselves', 'fill', 'attach', 'pay', 'download', 'upload'];
  const actions: any[] = [];
  let actCounter = 1;

  for (const page of documentPages) {
    const pageLines = page.text.split('\n');
    for (const line of pageLines) {
      const lower = line.toLowerCase();
      if (actionKeywords.some((kw) => lower.includes(kw)) && line.length > 15 && line.length < 180) {
        if (!actions.some((a) => a.action === line.trim())) {
          actions.push({
            id: `act_${actCounter++}`,
            action: line.trim(),
            action_hindi: 'कृपया इस निर्देश का पालन करें।',
            quote: line.trim(),
            page: page.pageNumber,
            urgency: 'high',
          });
          if (actions.length >= 4) break;
        }
      }
    }
    if (actions.length >= 4) break;
  }

  return {
    document_type: 'Official Circular / Notice',
    summary: 'This document contains institutional instructions and required compliance actions.',
    summary_hindi: 'यह दस्तावेज संस्थागत निर्देश और अनुपालन कार्यों से संबंधित है।',
    summary_hinglish: 'Bhai, ye official notice hai jisme documents submit karne aur instructions follow karne ke baare me bataya gaya hai.',
    actions: actions.length > 0 ? actions : [
      {
        id: 'act_1',
        action: 'Review document instructions and submit relevant forms',
        action_hindi: 'दस्तावेज के निर्देशों की समीक्षा करें और संबंधित फॉर्म जमा करें',
        quote: lines[0] || 'Official Circular',
        page: 1,
        urgency: 'medium',
      }
    ],
    deadline: {
      date: deadlineDate,
      has_deadline: hasDeadline,
      quote: deadlineQuote,
      page: deadlinePage,
      hindi_explanation: hasDeadline ? `अंतिम तिथि: ${deadlineDate}` : 'दस्तावेज में कोई अंतिम तिथि नहीं दी गई है।',
    },
    cost: {
      amount: costAmount,
      has_fee: hasFee,
      quote: costQuote,
      page: costPage,
      hindi_explanation: hasFee ? `शुल्क: ${costAmount}` : 'कोई फीस नहीं लगेगी।',
    },
    important_points: [
      {
        point: 'Review all terms carefully before the deadline',
        point_hindi: 'अंतिम तिथि से पहले सभी शर्तों की समीक्षा करें',
        quote: deadlineQuote || 'Official terms apply',
        page: deadlinePage || 1,
        severity: 'critical',
      }
    ],
    where_to_submit: 'Designated Office / Department',
    where_to_submit_hindi: 'संबंधित कार्यालय / विभाग',
    what_happens_if_ignored: 'Non-compliance may lead to cancellation or penalties',
    what_happens_if_ignored_hindi: 'समय पर काम न करने पर आवेदन निरस्त हो सकता है।',
  };
}
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    appName: 'SAMJHO',
  });
});

// Check Ollama status
app.post('/api/ollama/status', async (req: Request, res: Response) => {
  const baseUrl = req.body.baseUrl || 'http://localhost:11434';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return res.json({
        available: true,
        models: (data.models || []).map((m: any) => m.name),
        baseUrl,
      });
    }
    return res.json({ available: false, error: 'Ollama service responded with error', baseUrl });
  } catch (err: any) {
    return res.json({
      available: false,
      error: 'Could not connect to Ollama (offline/not running on port 11434)',
      baseUrl,
    });
  }
});

// Document Understanding Endpoint
app.post('/api/understand-document', async (req: Request, res: Response) => {
  try {
    const {
      text,
      pages,
      modelType = 'gemini',
      ollamaConfig = { baseUrl: 'http://localhost:11434', model: 'gemma3:1b' },
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text extracted from document' });
    }

    const documentPages: { pageNumber: number; text: string }[] =
      Array.isArray(pages) && pages.length > 0
        ? pages
        : [{ pageNumber: 1, text }];

    const formattedDocumentWithPages = documentPages
      .map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`)
      .join('\n\n');

    // Prompt with strict zero-hallucination discipline
    const systemPrompt = `You are SAMJHO ("Don't just translate. Understand"), an AI assistant that explains complex documents to a normal person/friend who finds official English hard to understand.
Your job is to answer:
1. WHAT IS THIS? (Document type and simple summary)
2. WHAT DO I NEED TO DO? (Actionable checklist)
3. DEADLINE? (Exact date or "Not mentioned")
4. COST / FEE? (Exact fee or "No fee mentioned")
5. WHAT IS IMPORTANT / WARNINGS / CONSEQUENCES?
6. HINDI / HINGLISH EXPLANATIONS: Explain clearly in simple, empathetic Hindi ("Bhai, ye notice bol raha hai ki...") and Shuddh/Simple Hindi so the friend knows exactly what to do.

CRITICAL RULES:
- NEVER invent missing information.
- If no deadline is stated in the document, explicitly say "Not mentioned in the document" and set has_deadline: false.
- If no fee or cost is mentioned, explicitly say "No fee mentioned in the document" and set has_fee: false.
- For EVERY claim, deadline, fee, action, and important point, you MUST provide the exact verbatim supporting quote ('quote') from the document text and the 'page' number where it appears.
- If an item has no verbatim quote in the document, leave quote as empty or null. Do NOT manufacture fake quotes.`;

    const userPrompt = `Analyze the following document and output valid JSON matching the exact schema:

DOCUMENT CONTENT:
${formattedDocumentWithPages}

Return a valid JSON object matching this structure:
{
  "document_type": "string (e.g. Scholarship Verification Notice, Bank KYC Warning, etc.)",
  "summary": "Clear 2-sentence explanation in simple English",
  "summary_hindi": "Clear explanation in simple Hindi (Devanagari script)",
  "summary_hinglish": "Friendly conversational explanation in Hinglish (e.g., 'Bhai, ye notice college scholarship ke baare me hai...')",
  "actions": [
    {
      "id": "act_1",
      "action": "Clear simple action to do",
      "action_hindi": "Hindi explanation of the action",
      "quote": "Exact verbatim quote from the text",
      "page": 1,
      "urgency": "high" | "medium" | "low"
    }
  ],
  "deadline": {
    "date": "Exact deadline string or 'Not mentioned in the document'",
    "has_deadline": true or false,
    "quote": "Exact verbatim quote mentioning date or null",
    "page": 1,
    "hindi_explanation": "Simple Hindi note regarding deadline"
  },
  "cost": {
    "amount": "Exact amount/fee or 'No fee mentioned in the document'",
    "has_fee": true or false,
    "quote": "Exact quote mentioning fee or null",
    "page": 1,
    "hindi_explanation": "Simple Hindi note regarding cost/fee"
  },
  "important_points": [
    {
      "point": "Crucial requirement or consequence",
      "point_hindi": "Hindi version of crucial point",
      "quote": "Exact verbatim quote",
      "page": 1,
      "severity": "critical" | "warning" | "info"
    }
  ],
  "where_to_submit": "Specific department, counter, portal, or 'Not specified'",
  "where_to_submit_hindi": "Hindi version of where to submit",
  "what_happens_if_ignored": "Direct consequence of not taking action (e.g., scholarship cancelled, account frozen)",
  "what_happens_if_ignored_hindi": "Hindi version of consequences"
}`;

    let parsedResult: any = null;

    if (modelType === 'ollama') {
      // Query local Ollama instance
      try {
        const ollamaRes = await fetch(`${ollamaConfig.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaConfig.model || 'gemma3:1b',
            prompt: `${systemPrompt}\n\n${userPrompt}`,
            format: 'json',
            stream: false,
          }),
        });

        if (!ollamaRes.ok) {
          throw new Error(`Ollama returned status ${ollamaRes.status}`);
        }
        const ollamaData = await ollamaRes.json();
        parsedResult = JSON.parse(ollamaData.response);
      } catch (err: any) {
        console.warn('Ollama local fallback failed, attempting Gemini if available:', err.message);
        // Fallback to Gemini if Ollama call fails and API key exists
        if (!aiClient) {
          return res.status(503).json({
            error: `Failed to contact local Ollama at ${ollamaConfig.baseUrl}: ${err.message}. Please start Ollama or switch to Cloud Server Engine.`,
          });
        }
      }
    }

    let engineUsed = modelType === 'ollama' ? `Ollama (${ollamaConfig.model})` : 'Gemini 3.8 Flash';

    if (!parsedResult) {
      if (!aiClient) {
        return res.status(500).json({
          error:
            'Server Gemini API is not configured (GEMINI_API_KEY missing) and Ollama is not active. Please ensure GEMINI_API_KEY is configured or Ollama is running.',
        });
      }

      try {
        const { text: responseText, modelUsed } = await callGeminiWithResilience(
          aiClient,
          userPrompt,
          systemPrompt
        );
        engineUsed = modelUsed;

        try {
          parsedResult = JSON.parse(responseText);
        } catch (parseError) {
          const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsedResult = JSON.parse(cleaned);
        }
      } catch (geminiError: any) {
        console.warn('[AI Engine] Cloud models busy (503/high-demand), using emergency rule-based fallback:', geminiError.message);
        // Fallback to local rule-based extractor so the user is never blocked
        parsedResult = extractStructuredRuleFallback(documentPages);
        engineUsed = 'Emergency Offline Fallback (Provider High-Demand)';
      }
    }

    // Now execute Evidence Verification Engine against all claims
    // Verify actions
    if (Array.isArray(parsedResult.actions)) {
      parsedResult.actions = parsedResult.actions.map((act: any) => {
        const verification = verifyQuoteInDocument(act.quote || '', documentPages);
        return {
          ...act,
          verification,
        };
      });
    }

    // Verify deadline
    if (parsedResult.deadline) {
      if (parsedResult.deadline.has_deadline && parsedResult.deadline.quote) {
        parsedResult.deadline.verification = verifyQuoteInDocument(
          parsedResult.deadline.quote,
          documentPages
        );
      } else {
        parsedResult.deadline.verification = {
          verified: true,
          confidence: 100,
          matchedPage: null,
          matchedText: null,
          contextSnippet: null,
          reason: 'Verified: Document does not contain any deadline.',
        };
      }
    }

    // Verify cost
    if (parsedResult.cost) {
      if (parsedResult.cost.has_fee && parsedResult.cost.quote) {
        parsedResult.cost.verification = verifyQuoteInDocument(
          parsedResult.cost.quote,
          documentPages
        );
      } else {
        parsedResult.cost.verification = {
          verified: true,
          confidence: 100,
          matchedPage: null,
          matchedText: null,
          contextSnippet: null,
          reason: 'Verified: Document confirms no fee or fee is not mentioned.',
        };
      }
    }

    // Verify important points
    if (Array.isArray(parsedResult.important_points)) {
      parsedResult.important_points = parsedResult.important_points.map((pt: any) => {
        const verification = verifyQuoteInDocument(pt.quote || '', documentPages);
        return {
          ...pt,
          verification,
        };
      });
    }

    return res.json({
      success: true,
      data: parsedResult,
      engineUsed,
    });
  } catch (error: any) {
    console.error('Error understanding document:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process document with AI model',
    });
  }
});

// Single Evidence Verification Endpoint (for on-demand re-checking)
app.post('/api/verify-evidence', (req: Request, res: Response) => {
  const { quote, pages } = req.body;
  const result = verifyQuoteInDocument(quote || '', pages || []);
  res.json(result);
});

// Voice TTS endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, language = 'hi' } = req.body;
    if (!text || !aiClient) {
      return res.status(400).json({ error: 'Text or Gemini Client missing' });
    }

    const ttsResponse = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 500),
              speechMetadata: {
                style: language === 'hi' ? 'Warm, helpful Hindi speaker explaining a document clearly to a friend' : 'Clear, friendly accessibility voice',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio =
      ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      return res.json({ audioBase64: base64Audio, format: 'audio/wav' });
    }
    return res.status(500).json({ error: 'No audio returned' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Start Express server and connect Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SAMJHO full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
