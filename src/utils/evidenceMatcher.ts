import { DocumentPage, EvidenceVerification } from '../types';

export function findQuoteMatch(
  quote: string,
  pages: DocumentPage[]
): {
  matchedPage: number;
  highlightedText: string;
  found: boolean;
  score: number;
} {
  if (!quote || quote.trim().length === 0) {
    return {
      matchedPage: 1,
      highlightedText: pages[0]?.text || '',
      found: false,
      score: 0,
    };
  }

  const cleanQuote = quote.trim();
  const lowerQuote = cleanQuote.toLowerCase();

  // 1. Exact match search
  for (const page of pages) {
    const pageText = page.text;
    const lowerPage = pageText.toLowerCase();
    const idx = lowerPage.indexOf(lowerQuote);

    if (idx !== -1) {
      const before = pageText.substring(0, idx);
      const match = pageText.substring(idx, idx + cleanQuote.length);
      const after = pageText.substring(idx + cleanQuote.length);

      return {
        matchedPage: page.pageNumber,
        highlightedText: `${escapeHtml(before)}<mark class="bg-amber-300 text-amber-950 font-bold px-1.5 py-0.5 rounded shadow-sm border border-amber-400 ring-2 ring-amber-400/50">${escapeHtml(match)}</mark>${escapeHtml(after)}`,
        found: true,
        score: 1.0,
      };
    }
  }

  // 2. Fuzzy words search (matches contiguous chunk of words)
  const words = cleanQuote.split(/\s+/).filter((w) => w.length > 2);
  if (words.length >= 3) {
    for (const page of pages) {
      const pageText = page.text;
      const lowerPage = pageText.toLowerCase();

      // Check first 3 words
      const keyPhrase = words.slice(0, 3).join(' ').toLowerCase();
      const idx = lowerPage.indexOf(keyPhrase);
      if (idx !== -1) {
        const estEnd = Math.min(pageText.length, idx + cleanQuote.length + 30);
        const before = pageText.substring(0, idx);
        const match = pageText.substring(idx, estEnd);
        const after = pageText.substring(estEnd);

        return {
          matchedPage: page.pageNumber,
          highlightedText: `${escapeHtml(before)}<mark class="bg-amber-200 text-amber-950 font-semibold px-1 py-0.5 rounded border border-amber-300">${escapeHtml(match)}</mark>${escapeHtml(after)}`,
          found: true,
          score: 0.85,
        };
      }
    }
  }

  // If no match found, return first page unhighlighted
  return {
    matchedPage: 1,
    highlightedText: escapeHtml(pages[0]?.text || ''),
    found: false,
    score: 0,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatIndianCurrency(amountStr: string): string {
  return amountStr;
}
