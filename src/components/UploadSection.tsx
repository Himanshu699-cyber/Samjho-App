import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  FileImage,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
  FileCheck,
  Zap,
  Building2,
  GraduationCap,
  Landmark,
  Scale,
  ClipboardPaste,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data/sampleDocuments';

interface UploadSectionProps {
  onFileSelected: (file: File) => void;
  onSampleSelected: (sample: SampleDocument) => void;
  onRawTextSubmitted: (title: string, text: string) => void;
  isLoading: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFileSelected,
  onSampleSelected,
  onRawTextSubmitted,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    onRawTextSubmitted(pastedTitle || 'Pasted Document', pastedText);
    setShowPasteModal(false);
    setPastedTitle('');
    setPastedText('');
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto pt-4 sm:pt-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          Hacktoberfest Weekend Challenge — Build for a Friend
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Don’t just translate.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500">
            Understand.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          Whenever you or your friend ask <span className="font-semibold text-slate-800 italic">“Bhai, ye document kya bol raha hai?”</span> — SAMJHO explains what it means, what to submit, the exact deadline, cost, and proves every claim.
        </p>

        {/* 6 Core Questions flow badge */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-2 text-[11px] sm:text-xs font-semibold text-slate-500">
          <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-slate-800">1. WHAT IS THIS?</span>
          <span>→</span>
          <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-orange-700">2. WHAT DO I DO?</span>
          <span>→</span>
          <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-slate-800">3. WHEN?</span>
          <span>→</span>
          <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-slate-800">4. HOW MUCH?</span>
          <span>→</span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">5. PROVE IT</span>
        </div>
      </div>

      {/* Main Upload Zone */}
      <div className="max-w-2xl mx-auto">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${
            isDragging
              ? 'border-orange-500 bg-orange-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-orange-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 shadow-xs">
            <Upload className="w-8 h-8 stroke-[1.75]" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Upload PDF or Scanned Document
          </h3>
          <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
            Drop college circular, scholarship form, bank letter, or court notice here. Automatic OCR for scanned pages.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Browse Document
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPasteModal(true);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all flex items-center gap-1.5"
            >
              <ClipboardPaste className="w-4 h-4 text-slate-500" />
              Paste Text
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> PDF (Selectable text)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileImage className="w-3.5 h-3.5" /> Scans & Photos (OCR)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> 100% Client-Side Safe
            </span>
          </div>
        </div>
      </div>

      {/* Representative Test Documents */}
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Or Try Real Test Documents (1-Click Test)
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              PRD Test Cases
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click any notice to test instant understanding & quote verification
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SAMPLE_DOCUMENTS.map((doc) => {
            const isNoDeadline = doc.id === 'exam-elective-no-deadline';
            const isScanned = doc.isScanned;

            return (
              <button
                key={doc.id}
                onClick={() => onSampleSelected(doc)}
                disabled={isLoading}
                className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-orange-50/40 hover:border-orange-300 text-left transition-all shadow-2xs hover:shadow-xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 group-hover:bg-orange-100 group-hover:text-orange-800 transition-colors">
                      {doc.category}
                    </span>
                    {isNoDeadline && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        Zero-Hallucination
                      </span>
                    )}
                    {isScanned && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        OCR Demo
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-orange-700 transition-colors line-clamp-1">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600 group-hover:text-orange-700">
                  <span>Analyze this sample</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paste Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">
              Paste Notice / Circular Text
            </h3>
            <p className="text-xs text-slate-500">
              Copy-pasted a message from WhatsApp, email, or college portal? Paste it here to test understanding.
            </p>
            <form onSubmit={handlePasteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={pastedTitle}
                  onChange={(e) => setPastedTitle(e.target.value)}
                  placeholder="e.g. Hostels Fee Notice or Electricity Circular"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Text Content *
                </label>
                <textarea
                  rows={8}
                  required
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste the full text of the notice here..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs"
                >
                  Understand Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
