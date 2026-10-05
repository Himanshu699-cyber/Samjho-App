import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  AlertCircle,
  Clock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Share2,
  Download,
  RotateCcw,
  CheckSquare,
  Square,
  Sparkles,
  MapPin,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  DocumentUnderstandingResult,
  DocumentPage,
  ExplanationLanguage,
  ActionItem,
  ImportantPoint,
  EvidenceVerification,
} from '../types';
import { SpeechNarrator } from '../utils/audioSpeech';

interface ResultDashboardProps {
  result: DocumentUnderstandingResult;
  documentTitle: string;
  documentPages: DocumentPage[];
  language: ExplanationLanguage;
  onOpenProveIt: (
    claimTitle: string,
    claimValue: string,
    quote?: string | null,
    page?: number | null,
    verification?: EvidenceVerification
  ) => void;
  onReset: () => void;
}

export const ResultDashboard: React.FC<ResultDashboardProps> = ({
  result,
  documentTitle,
  documentPages,
  language,
  onOpenProveIt,
  onReset,
}) => {
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFullDocPreview, setShowFullDocPreview] = useState(false);

  const toggleAction = (id: string) => {
    setCompletedActions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Get active text based on selected language
  const getSummary = () => {
    if (language === 'hinglish') return result.summary_hinglish || result.summary;
    if (language === 'hindi') return result.summary_hindi || result.summary;
    return result.summary;
  };

  const getActionText = (action: ActionItem) => {
    if (language === 'hindi') return action.action_hindi || action.action;
    if (language === 'hinglish') return action.action_hindi ? `${action.action} (${action.action_hindi})` : action.action;
    return action.action;
  };

  const getImportantText = (pt: ImportantPoint) => {
    if (language === 'hindi') return pt.point_hindi || pt.point;
    if (language === 'hinglish') return pt.point_hindi ? `${pt.point} (${pt.point_hindi})` : pt.point;
    return pt.point;
  };

  const handleAudioPlayback = () => {
    if (isSpeaking) {
      SpeechNarrator.stop();
      setIsSpeaking(false);
    } else {
      const textToRead = `${getSummary()}. Actions needed: ${result.actions.map((a) => a.action).join('. ')}`;
      const langCode = language === 'simple_english' ? 'en' : 'hi';
      const started = SpeechNarrator.speak(
        textToRead,
        langCode,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
      if (!started) {
        alert('Voice synthesis not available in this browser.');
      }
    }
  };

  const handleExportText = () => {
    const content = `SAMJHO - DOCUMENT SUMMARY
Title: ${documentTitle}
Type: ${result.document_type}
Summary: ${getSummary()}

DEADLINE: ${result.deadline.date}
COST / FEE: ${result.cost.amount}
WHERE TO SUBMIT: ${result.where_to_submit || 'Not specified'}

REQUIRED ACTIONS:
${result.actions.map((a, i) => `${i + 1}. [ ] ${a.action} (Urgency: ${a.urgency})`).join('\n')}

IMPORTANT POINTS:
${result.important_points.map((p, i) => `• ${p.point}`).join('\n')}

CONSEQUENCE IF IGNORED:
${result.what_happens_if_ignored || 'None stated'}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAMJHO-ActionPlan-${documentTitle.slice(0, 20)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top action toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
              Analyzed Document
            </span>
            <h2 className="text-base font-extrabold text-slate-900 line-clamp-1">
              {documentTitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio narration button */}
          <button
            onClick={handleAudioPlayback}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isSpeaking
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
            }`}
            title="Read explanation out loud"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" /> Stop Voice
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" /> Suniye (Listen)
              </>
            )}
          </button>

          {/* Export button */}
          <button
            onClick={handleExportText}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs"
            title="Export action plan"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export Checklist</span>
          </button>

          {/* Upload another */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload New</span>
          </button>
        </div>
      </div>

      {/* CARD 1: WHAT IS THIS? (Document Type & Simple Summary) */}
      <section className="bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 rounded-3xl p-6 sm:p-7 border border-orange-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-400/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-600 text-white text-[11px] font-extrabold tracking-wider uppercase">
              1. WHAT IS THIS?
            </span>
            <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
              {result.document_type}
            </span>
          </div>

          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            Clear language explanation
          </span>
        </div>

        <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
          {getSummary()}
        </p>

        {/* Where to submit pill if available */}
        {result.where_to_submit && result.where_to_submit !== 'Not specified' && (
          <div className="mt-4 pt-3 border-t border-orange-200/60 flex items-center gap-2 text-xs font-semibold text-orange-950">
            <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Submission Location: <strong>{result.where_to_submit}</strong></span>
          </div>
        )}
      </section>

      {/* CARD 2: WHAT DO I NEED TO DO? (Action Checklist) */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-extrabold tracking-wider uppercase">
              2. WHAT DO I NEED TO DO?
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({result.actions.length} action{result.actions.length === 1 ? '' : 's'})
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click checkbox to mark done • Click Prove It to verify quote
          </span>
        </div>

        <div className="space-y-3">
          {result.actions.map((act) => {
            const isDone = !!completedActions[act.id];
            const isVerified = act.verification?.verified ?? !!act.quote;

            return (
              <div
                key={act.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white hover:bg-slate-50/70 border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleAction(act.id)}
                    className="mt-0.5 text-slate-400 hover:text-orange-600 transition-colors"
                  >
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <div className="space-y-0.5">
                    <p
                      className={`text-sm font-bold text-slate-900 leading-snug ${
                        isDone ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {act.action}
                    </p>
                    {language !== 'simple_english' && act.action_hindi && (
                      <p className="text-xs text-slate-600 font-medium font-hindi">
                        {act.action_hindi}
                      </p>
                    )}
                    {act.urgency && (
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                          act.urgency === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : act.urgency === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Urgency: {act.urgency}
                      </span>
                    )}
                  </div>
                </div>

                {/* Prove Button */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {act.quote ? (
                    <button
                      onClick={() =>
                        onOpenProveIt(
                          'Action Requirement',
                          act.action,
                          act.quote,
                          act.page,
                          act.verification
                        )
                      }
                      className="px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Inspect verbatim quote from the original document"
                    >
                      <span>[PROVE THIS ACTION]</span>
                      {isVerified ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Inferred from context
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CARDS 3 & 4: DEADLINE & COST (Side-by-side Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 3: DEADLINE */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" />
                3. DEADLINE (WHEN?)
              </span>
              {result.deadline.has_deadline ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Crucial Date
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Zero Hallucination
                </span>
              )}
            </div>

            <h3
              className={`text-2xl font-black tracking-tight ${
                result.deadline.has_deadline
                  ? 'text-rose-700'
                  : 'text-slate-700'
              }`}
            >
              {result.deadline.date}
            </h3>

            {result.deadline.hindi_explanation && (
              <p className="text-xs text-slate-600 mt-2 font-medium">
                {result.deadline.hindi_explanation}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              Source: {result.deadline.has_deadline ? `Page ${result.deadline.page || 1}` : 'No deadline stated'}
            </span>

            <button
              onClick={() =>
                onOpenProveIt(
                  'Submission Deadline',
                  result.deadline.date,
                  result.deadline.quote,
                  result.deadline.page,
                  result.deadline.verification
                )
              }
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>[PROVE THE DEADLINE]</span>
              {result.deadline.verification?.verified ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              )}
            </button>
          </div>
        </section>

        {/* CARD 4: COST / FEE */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1">
                <Coins className="w-3 h-3" />
                4. COST / FEE (HOW MUCH?)
              </span>
              {result.cost.has_fee ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Payment Required
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Free / No Charge
                </span>
              )}
            </div>

            <h3
              className={`text-2xl font-black tracking-tight ${
                result.cost.has_fee ? 'text-amber-800' : 'text-emerald-800'
              }`}
            >
              {result.cost.amount}
            </h3>

            {result.cost.hindi_explanation && (
              <p className="text-xs text-slate-600 mt-2 font-medium">
                {result.cost.hindi_explanation}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              Source: {result.cost.has_fee ? `Page ${result.cost.page || 1}` : 'No fee mentioned'}
            </span>

            <button
              onClick={() =>
                onOpenProveIt(
                  'Cost / Fee Details',
                  result.cost.amount,
                  result.cost.quote,
                  result.cost.page,
                  result.cost.verification
                )
              }
              className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>[PROVE THE COST]</span>
              {result.cost.verification?.verified ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              )}
            </button>
          </div>
        </section>
      </div>

      {/* CARD 5: IMPORTANT & CONSEQUENCES (What happens if I do nothing?) */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[11px] font-extrabold tracking-wider uppercase">
            5. WHAT IS IMPORTANT & CONSEQUENCES
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Critical warnings & clauses
          </span>
        </div>

        {/* Warning Callout: What happens if ignored? */}
        {result.what_happens_if_ignored && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 flex items-start gap-3">
            <Flame className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-rose-900">
                What happens if you ignore this notice?
              </span>
              <p className="text-sm font-bold text-rose-950">
                {result.what_happens_if_ignored}
              </p>
              {language !== 'simple_english' && result.what_happens_if_ignored_hindi && (
                <p className="text-xs text-rose-800 font-medium font-hindi">
                  {result.what_happens_if_ignored_hindi}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Important Points List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {result.important_points.map((pt, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <Info className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {pt.severity || 'Important Requirement'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 leading-snug">
                  {getImportantText(pt)}
                </p>
              </div>

              {pt.quote && (
                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() =>
                      onOpenProveIt(
                        'Important Point',
                        pt.point,
                        pt.quote,
                        pt.page,
                        pt.verification
                      )
                    }
                    className="text-[11px] font-bold text-orange-700 hover:text-orange-900 flex items-center gap-1"
                  >
                    <span>[PROVE IT]</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Accordion: View Full Extracted Document Text */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <button
          onClick={() => setShowFullDocPreview(!showFullDocPreview)}
          className="w-full px-5 py-3 text-left font-bold text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            View Raw Extracted Document Text ({documentPages.length} Page{documentPages.length === 1 ? '' : 's'})
          </span>
          {showFullDocPreview ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showFullDocPreview && (
          <div className="p-5 border-t border-slate-200 bg-slate-50/80 font-mono text-xs text-slate-800 space-y-4 max-h-96 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
            {documentPages.map((p) => (
              <div key={p.pageNumber} className="space-y-1">
                <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                  --- PAGE {p.pageNumber} ---
                </span>
                <p className="p-3 bg-white rounded-xl border border-slate-200">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
