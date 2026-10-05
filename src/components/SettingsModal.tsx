import React, { useState } from 'react';
import { X, Cpu, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, HardDrive, Sparkles } from 'lucide-react';
import { AIModelEngine, OllamaSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: AIModelEngine;
  setEngine: (engine: AIModelEngine) => void;
  ollamaSettings: OllamaSettings;
  setOllamaSettings: (settings: OllamaSettings) => void;
  onTestOllama: () => Promise<boolean>;
  ollamaTesting: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  engine,
  setEngine,
  ollamaSettings,
  setOllamaSettings,
  onTestOllama,
  ollamaTesting,
}) => {
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTestResult(null);
    const ok = await onTestOllama();
    if (ok) {
      setTestResult({
        success: true,
        message: 'Successfully connected to local Ollama service! Gemma model ready.',
      });
    } else {
      setTestResult({
        success: false,
        message: 'Could not connect to Ollama on http://localhost:11434. Make sure Ollama is running (`ollama serve`).',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-lg text-slate-900">AI Engine & Privacy Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Processing Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cloud Gemini Engine */}
              <button
                type="button"
                onClick={() => setEngine('gemini')}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  engine === 'gemini'
                    ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    Cloud Server Engine
                  </span>
                  {engine === 'gemini' && (
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Powered by Gemini 3.8 Flash. Instant analysis with zero local setup.
                </p>
                <div className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 inline-block px-1.5 py-0.5 rounded">
                  Recommended for Preview
                </div>
              </button>

              {/* Local Ollama Gemma Engine */}
              <button
                type="button"
                onClick={() => setEngine('ollama')}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  engine === 'ollama'
                    ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-slate-700" />
                    Local Ollama (Gemma)
                  </span>
                  {engine === 'ollama' && (
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Full 100% offline local inference via Ollama + Gemma 3 1B on your laptop.
                </p>
                <div className="mt-2 text-[10px] font-semibold text-slate-700 bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                  PRD Target Architecture
                </div>
              </button>
            </div>
          </div>

          {/* Ollama Configuration if selected */}
          {engine === 'ollama' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Ollama Local API Config</span>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={ollamaTesting}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ollamaTesting ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Ollama Base URL</label>
                <input
                  type="text"
                  value={ollamaSettings.baseUrl}
                  onChange={(e) =>
                    setOllamaSettings({ ...ollamaSettings, baseUrl: e.target.value })
                  }
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="http://localhost:11434"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Model Name</label>
                <input
                  type="text"
                  value={ollamaSettings.model}
                  onChange={(e) =>
                    setOllamaSettings({ ...ollamaSettings, model: e.target.value })
                  }
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="gemma3:1b or gemma:2b"
                />
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Privacy Guarantee Note */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Friend Privacy Guarantee:</p>
              <p>
                Documents uploaded to SAMJHO are parsed in-memory for understanding and evidence verification. No documents are stored in persistent databases or shared with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
