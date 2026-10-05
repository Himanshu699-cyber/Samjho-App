import React from 'react';
import { Loader2, FileSearch, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ProcessingStateProps {
  stage: 'extracting' | 'ocr' | 'ai_understanding' | 'verifying_evidence';
  progressPercent: number;
  message: string;
  isScanned?: boolean;
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({
  stage,
  progressPercent,
  message,
  isScanned,
}) => {
  const steps = [
    {
      id: 'extracting',
      title: isScanned ? 'Tesseract OCR' : 'Text Extraction',
      description: isScanned ? 'Scanning image pixels for text' : 'Extracting text from PDF pages',
    },
    {
      id: 'ai_understanding',
      title: 'AI Understanding',
      description: 'Gemma / Gemini mapping actions & facts',
    },
    {
      id: 'verifying_evidence',
      title: 'Evidence Verification',
      description: 'Validating claims against original text',
    },
  ];

  const getStepStatus = (stepId: string) => {
    if (stage === stepId || (stepId === 'extracting' && stage === 'ocr')) {
      return 'active';
    }
    if (
      (stepId === 'extracting' && (stage === 'ai_understanding' || stage === 'verifying_evidence')) ||
      (stepId === 'ai_understanding' && stage === 'verifying_evidence')
    ) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center animate-in fade-in duration-300">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-100/70 border border-orange-200 flex items-center justify-center text-orange-600 shadow-inner">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-extrabold text-slate-900">
          SAMJHO is reading your document...
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          “Don’t just translate. Understand.”
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(10, progressPercent)}%` }}
          />
        </div>
        <p className="text-xs font-mono font-medium text-slate-600">{message}</p>
      </div>

      {/* Pipeline Stepper */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-left">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border text-xs transition-all ${
                status === 'active'
                  ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20'
                  : status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-slate-100 bg-slate-50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : status === 'active' ? (
                  <Loader2 className="w-3.5 h-3.5 text-orange-600 animate-spin shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 text-[10px] flex items-center justify-center text-slate-400">
                    {idx + 1}
                  </span>
                )}
                <span
                  className={
                    status === 'active'
                      ? 'text-orange-900'
                      : status === 'completed'
                      ? 'text-emerald-900'
                      : 'text-slate-500'
                  }
                >
                  {step.title}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
