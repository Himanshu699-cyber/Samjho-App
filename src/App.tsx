/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UploadSection } from './components/UploadSection';
import { ProcessingState } from './components/ProcessingState';
import { ResultDashboard } from './components/ResultDashboard';
import { ProveItModal } from './components/ProveItModal';
import { SettingsModal } from './components/SettingsModal';
import { PythonCodeModal } from './components/PythonCodeModal';
import {
  ExplanationLanguage,
  AIModelEngine,
  OllamaSettings,
  DocumentUnderstandingResult,
  DocumentPage,
  EvidenceVerification,
} from './types';
import { extractTextFromPDF, extractTextFromImage } from './utils/pdfExtractor';
import { SampleDocument } from './data/sampleDocuments';
import { AlertCircle, Shield, HeartHandshake, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<ExplanationLanguage>('hinglish');
  const [engine, setEngine] = useState<AIModelEngine>('gemini');
  const [ollamaSettings, setOllamaSettings] = useState<OllamaSettings>({
    baseUrl: 'http://localhost:11434',
    model: 'gemma3:1b',
  });
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean>(false);
  const [ollamaTesting, setOllamaTesting] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);

  // Document state
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [documentPages, setDocumentPages] = useState<DocumentPage[]>([]);
  const [isScannedDoc, setIsScannedDoc] = useState<boolean>(false);

  // Result state
  const [result, setResult] = useState<DocumentUnderstandingResult | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<
    'extracting' | 'ocr' | 'ai_understanding' | 'verifying_evidence'
  >('extracting');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prove It modal state
  const [proveItModal, setProveItModal] = useState<{
    isOpen: boolean;
    claimTitle: string;
    claimValue: string;
    quote?: string | null;
    page?: number | null;
    verification?: EvidenceVerification;
  }>({
    isOpen: false,
    claimTitle: '',
    claimValue: '',
  });

  const [lastDocumentData, setLastDocumentData] = useState<{
    title: string;
    pages: DocumentPage[];
    fullText: string;
    isScanned: boolean;
  } | null>(null);

  // Check Ollama status on initial mount
  useEffect(() => {
    testOllamaConnection();
  }, []);

  const testOllamaConnection = async (): Promise<boolean> => {
    setOllamaTesting(true);
    try {
      const res = await fetch('/api/ollama/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: ollamaSettings.baseUrl }),
      });
      const data = await res.json();
      setOllamaAvailable(data.available);
      setOllamaTesting(false);
      return data.available;
    } catch (e) {
      setOllamaAvailable(false);
      setOllamaTesting(false);
      return false;
    }
  };

  const processExtractedText = async (
    title: string,
    pages: DocumentPage[],
    fullText: string,
    isScanned: boolean
  ) => {
    try {
      setLastDocumentData({ title, pages, fullText, isScanned });
      setDocumentTitle(title);
      setDocumentPages(pages);
      setIsScannedDoc(isScanned);

      // Next stage: AI understanding
      setProcessingStage('ai_understanding');
      setProgressPercent(65);
      setProgressMessage('SAMJHO AI (Gemma/Gemini) analyzing document structure & extracting facts...');

      const response = await fetch('/api/understand-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,
          pages: pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text })),
          modelType: engine,
          ollamaConfig: ollamaSettings,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to process document with AI model');
      }

      setProcessingStage('verifying_evidence');
      setProgressPercent(90);
      setProgressMessage('Evidence Verification Engine running zero-trust validation on quotes...');

      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error('SAMJHO couldn’t process this document. Please try again.');
      }

      setProgressPercent(100);
      setProgressMessage('Analysis and proof verification complete!');

      setTimeout(() => {
        setResult(data.data);
        setIsProcessing(false);
      }, 400);
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'SAMJHO couldn’t process this document. Please try again.');
    }
  };

  const handleFileSelected = async (file: File) => {
    setErrorMessage(null);
    setResult(null);
    setIsProcessing(true);
    setProcessingStage('extracting');
    setProgressPercent(10);
    setProgressMessage(`Reading file: ${file.name}...`);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const { pages, fullText, isScanned } = await extractTextFromPDF(
          file,
          (stage, percent, message) => {
            if (stage === 'running_ocr') {
              setProcessingStage('ocr');
            } else {
              setProcessingStage('extracting');
            }
            setProgressPercent(percent);
            setProgressMessage(message);
          }
        );

        if (!fullText.trim()) {
          throw new Error('SAMJHO couldn’t read any text from this document. Please upload a clearer copy.');
        }

        await processExtractedText(file.name, pages, fullText, isScanned);
      } else if (file.type.startsWith('image/')) {
        setProcessingStage('ocr');
        const { pages, fullText, isScanned } = await extractTextFromImage(
          file,
          (stage, percent, message) => {
            setProgressPercent(percent);
            setProgressMessage(message);
          }
        );

        if (!fullText.trim()) {
          throw new Error('OCR could not detect readable text in this image. Please upload a clearer document.');
        }

        await processExtractedText(file.name, pages, fullText, isScanned);
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        const text = await file.text();
        const pages: DocumentPage[] = [{ pageNumber: 1, text }];
        await processExtractedText(file.name, pages, text, false);
      } else {
        throw new Error('Unsupported format. Please upload a PDF, image (PNG/JPG), or text file.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Error reading document.');
    }
  };

  const handleSampleSelected = async (sample: SampleDocument) => {
    setErrorMessage(null);
    setResult(null);
    setIsProcessing(true);
    setProcessingStage('extracting');
    setProgressPercent(20);
    setProgressMessage(`Loading sample: ${sample.title}...`);

    const fullText = sample.pages
      .map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`)
      .join('\n\n');

    await processExtractedText(
      sample.title,
      sample.pages,
      fullText,
      !!sample.isScanned
    );
  };

  const handleRawTextSubmitted = async (title: string, text: string) => {
    setErrorMessage(null);
    setResult(null);
    setIsProcessing(true);
    setProcessingStage('extracting');
    setProgressPercent(20);
    setProgressMessage('Loading submitted text...');

    const pages: DocumentPage[] = [{ pageNumber: 1, text }];
    await processExtractedText(title, pages, text, false);
  };

  const openProveIt = (
    claimTitle: string,
    claimValue: string,
    quote?: string | null,
    page?: number | null,
    verification?: EvidenceVerification
  ) => {
    setProveItModal({
      isOpen: true,
      claimTitle,
      claimValue,
      quote,
      page,
      verification,
    });
  };

  const resetAll = () => {
    setResult(null);
    setDocumentTitle('');
    setDocumentPages([]);
    setErrorMessage(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/20 text-slate-800 flex flex-col font-sans selection:bg-orange-200">
      {/* Navbar */}
      <Navbar
        language={language}
        setLanguage={setLanguage}
        engine={engine}
        onOpenSettings={() => setIsSettingsOpen(true)}
        ollamaAvailable={ollamaAvailable}
        onOpenPythonCode={() => setIsPythonModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {lastDocumentData && (
                <button
                  onClick={() =>
                    processExtractedText(
                      lastDocumentData.title,
                      lastDocumentData.pages,
                      lastDocumentData.fullText,
                      lastDocumentData.isScanned
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs"
                >
                  Retry Analysis
                </button>
              )}
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-700 hover:text-rose-950 font-bold px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Screen States */}
        {isProcessing ? (
          <ProcessingState
            stage={processingStage}
            progressPercent={progressPercent}
            message={progressMessage}
            isScanned={isScannedDoc}
          />
        ) : result ? (
          <ResultDashboard
            result={result}
            documentTitle={documentTitle}
            documentPages={documentPages}
            language={language}
            onOpenProveIt={openProveIt}
            onReset={resetAll}
          />
        ) : (
          <UploadSection
            onFileSelected={handleFileSelected}
            onSampleSelected={handleSampleSelected}
            onRawTextSubmitted={handleRawTextSubmitted}
            isLoading={isProcessing}
          />
        )}
      </main>

      {/* Prove It Modal */}
      <ProveItModal
        isOpen={proveItModal.isOpen}
        onClose={() => setProveItModal((prev) => ({ ...prev, isOpen: false }))}
        claimTitle={proveItModal.claimTitle}
        claimValue={proveItModal.claimValue}
        quote={proveItModal.quote}
        page={proveItModal.page}
        verification={proveItModal.verification}
        documentPages={documentPages}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        engine={engine}
        setEngine={setEngine}
        ollamaSettings={ollamaSettings}
        setOllamaSettings={setOllamaSettings}
        onTestOllama={testOllamaConnection}
        ollamaTesting={ollamaTesting}
      />

      {/* Python Streamlit Code Modal */}
      <PythonCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-slate-900">SAMJHO (समझो)</span>
            <span>•</span>
            <span>“Don’t just translate. Understand.”</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-600">
              <HeartHandshake className="w-3.5 h-3.5 text-orange-600" />
              Build for a Friend
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Private & Offline-First Architecture
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
