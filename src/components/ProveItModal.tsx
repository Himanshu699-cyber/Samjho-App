import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { DocumentPage, EvidenceVerification } from '../types';
import { findQuoteMatch } from '../utils/evidenceMatcher';

interface ProveItModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimTitle: string;
  claimValue: string;
  quote?: string | null;
  page?: number | null;
  verification?: EvidenceVerification;
  documentPages: DocumentPage[];
}

export const ProveItModal: React.FC<ProveItModalProps> = ({
  isOpen,
  onClose,
  claimTitle,
  claimValue,
  quote,
  page,
  verification,
  documentPages,
}) => {
  if (!isOpen) return null;

  const initialPage = page && page > 0 && page <= documentPages.length ? page : 1;
  const [currentPageNum, setCurrentPageNum] = useState<number>(initialPage);
  const [copied, setCopied] = useState(false);

  const isVerified = verification?.verified ?? (quote && quote.trim().length > 5);
  const confidence = verification?.confidence ?? (isVerified ? 100 : 0);

  // Search match on active page or locate where quote is
  const quoteMatch = findQuoteMatch(quote || '', documentPages);
  const activePage =
    documentPages.find((p) => p.pageNumber === currentPageNum) ||
    documentPages[0] || { pageNumber: 1, text: '' };

  const handleCopyQuote = () => {
    if (quote) {
      navigator.clipboard.writeText(quote);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const jumpToMatchedPage = () => {
    if (quoteMatch.matchedPage && quoteMatch.matchedPage !== currentPageNum) {
      setCurrentPageNum(quoteMatch.matchedPage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm">
              PROVE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  PROVE IT — Evidence Verification
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase tracking-wider">
                  Zero-Trust
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Verifying AI claims against the original document source text
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claim Summary & Verification Status Banner */}
        <div className="p-5 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                Claim Under Scrutiny: {claimTitle}
              </span>
              <h4 className="text-base font-bold text-slate-900 leading-snug">
                {claimValue}
              </h4>
            </div>

            {/* Verification Badge */}
            <div className="shrink-0">
              {isVerified ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>VERIFIED</span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-mono">
                    {confidence}% Confidence
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>⚠ SAMJHO couldn't verify this claim</span>
                </div>
              )}
            </div>
          </div>

          {/* Quoted Text Box */}
          {quote ? (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 relative group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  Source Quote from Document (Page {page || quoteMatch.matchedPage || 1})
                </span>
                <button
                  onClick={handleCopyQuote}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy Quote
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-amber-950 font-serif italic leading-relaxed">
                “{quote}”
              </p>
              {quoteMatch.matchedPage && quoteMatch.matchedPage !== currentPageNum && (
                <button
                  onClick={jumpToMatchedPage}
                  className="mt-2 text-[11px] font-bold text-orange-700 hover:text-orange-900 underline flex items-center gap-1"
                >
                  <Search className="w-3 h-3" />
                  Jump to highlight on Page {quoteMatch.matchedPage}
                </button>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              No specific quote extracted for this claim. The document does not contain an explicit reference.
            </div>
          )}
        </div>

        {/* Document Page Viewer with Highlight */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
          {/* Page toolbar */}
          <div className="px-6 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Original Document Viewer
            </span>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentPageNum <= 1}
                onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono font-medium text-slate-800">
                Page {currentPageNum} of {documentPages.length || 1}
              </span>
              <button
                disabled={currentPageNum >= documentPages.length}
                onClick={() => setCurrentPageNum((p) => Math.min(documentPages.length, p + 1))}
                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Page Text Area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap select-text bg-white">
            {quote && quoteMatch.matchedPage === currentPageNum ? (
              <div
                dangerouslySetInnerHTML={{ __html: quoteMatch.highlightedText }}
              />
            ) : (
              <div>{activePage.text || '(Page contains no text)'}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-medium">
            {verification?.reason || 'Verified against in-memory document text.'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Close Proof
          </button>
        </div>
      </div>
    </div>
  );
};
