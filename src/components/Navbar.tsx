import React from 'react';
import { ShieldCheck, Cpu, Volume2, Globe, Sparkles, Terminal } from 'lucide-react';
import { ExplanationLanguage, AIModelEngine } from '../types';

interface NavbarProps {
  language: ExplanationLanguage;
  setLanguage: (lang: ExplanationLanguage) => void;
  engine: AIModelEngine;
  onOpenSettings: () => void;
  ollamaAvailable: boolean;
  onOpenPythonCode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  setLanguage,
  engine,
  onOpenSettings,
  ollamaAvailable,
  onOpenPythonCode,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-black text-xl tracking-tight">
            स
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                SAMJHO
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                समझो v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Don’t just translate. Understand.
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setLanguage('hinglish')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                language === 'hinglish'
                  ? 'bg-white text-orange-700 shadow-sm border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Conversational Hindi-English (Bhai Style)"
            >
              🇮🇳 Hinglish
            </button>
            <button
              onClick={() => setLanguage('hindi')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                language === 'hindi'
                  ? 'bg-white text-orange-700 shadow-sm border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="सरल हिंदी (Simple Hindi)"
            >
              सरल हिंदी
            </button>
            <button
              onClick={() => setLanguage('simple_english')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                language === 'simple_english'
                  ? 'bg-white text-orange-700 shadow-sm border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Simple English (No Legalese)"
            >
              Simple English
            </button>
          </div>

          {/* Python Streamlit Code button */}
          {onOpenPythonCode && (
            <button
              onClick={onOpenPythonCode}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
              title="View pure offline Python/Streamlit code from TDD"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>Python / Streamlit</span>
            </button>
          )}

          {/* Engine & Settings button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
            title="Configure AI Engine (Gemini / Local Ollama Gemma)"
          >
            <Cpu className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden md:inline">
              Engine: <strong className="text-slate-900">{engine === 'gemini' ? 'Gemini 3.8' : 'Ollama Gemma'}</strong>
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                engine === 'ollama'
                  ? ollamaAvailable
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </button>

          {/* Privacy badge */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-medium"
            title="Your documents are kept private"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Private</span>
          </div>
        </div>
      </div>
    </header>
  );
};
