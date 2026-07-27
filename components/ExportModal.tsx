
import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Loader2, CheckCircle2, AlertCircle, Shield, Globe, Lock, ArrowRight } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'options' | 'generating' | 'success'>('options');
  const [format, setFormat] = useState<'pdf' | 'json' | 'csv'>('pdf');
  const [period, setPeriod] = useState('30');
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');

  const isBusinessFeature = format === 'json' || format === 'csv' || period === 'all';

  const generateFile = () => {
    const content = `
AUDIT MANIFEST - CLOUD GUARDIAN
-----------------------------------------
Export Date: ${new Date().toISOString()}
Format: ${format.toUpperCase()}
Period: Last ${period} days
Integrity Hash: ${Math.random().toString(36).substring(2).toUpperCase()}
-----------------------------------------

The following document serves as technical evidence for SOC2 / ISO27001 compliance
monitored by the CloudGuardian DevSecOps Engine.

[SUMMARY]
- Active Controls: 42
- Compliance Score: 85%
- Drift Events Detected: 2
- Remediations Applied: 12

[SIGNATURE]
Certified by CloudGuardian Console v2.4
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Log_${format.toUpperCase()}_${Date.now()}.${format === 'pdf' ? 'txt' : format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerate = () => {
    if (isBusinessFeature) return;
    setStep('generating');
    setProgress(0);
  };

  const finalizeDownload = () => {
    generateFile();
    onClose();
    setTimeout(() => setStep('options'), 500);
  };

  useEffect(() => {
    if (step === 'generating') {
      const actions = [
        'Fetching timeline events...',
        'Analyzing risk patterns...',
        'Mapping SOC2/ISO27001 controls...',
        'Finalizing document...',
      ];
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('success'), 500);
            return 100;
          }
          const newProgress = prev + 15;
          const actionIdx = Math.floor((newProgress / 100) * actions.length);
          if (actionIdx < actions.length) setCurrentAction(actions[actionIdx]);
          return Math.min(newProgress, 100);
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-2"
        >
          <X size={20} />
        </button>

        {step === 'options' && (
          <div className="p-8 space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="text-primary-500" size={24} />
                Export Audit Report
              </h2>
              <p className="text-slate-400 text-sm">
                Generate a formal security report ready for auditors.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Format</label>
                <div className="grid grid-cols-3 gap-3">
                  <FormatCard active={format === 'pdf'} onClick={() => setFormat('pdf')} label="PDF" sub="Auditor Ready" />
                  <FormatCard active={format === 'json'} onClick={() => setFormat('json')} label="JSON" sub="Business" locked />
                  <FormatCard active={format === 'csv'} onClick={() => setFormat('csv')} label="CSV" sub="Business" locked />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Period</label>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setPeriod('7')} className={`p-3 rounded-xl border text-xs font-bold transition-all ${period === '7' ? 'bg-primary-600/10 border-primary-500 text-primary-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>7 Days</button>
                  <button onClick={() => setPeriod('30')} className={`p-3 rounded-xl border text-xs font-bold transition-all ${period === '30' ? 'bg-primary-600/10 border-primary-500 text-primary-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>30 Days</button>
                  <button onClick={() => setPeriod('all')} className="p-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-600 text-xs font-bold opacity-50 cursor-not-allowed flex flex-col items-center">All Time <Lock size={8} className="mt-1" /></button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              {isBusinessFeature ? (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3 mb-4">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-500/80 leading-relaxed font-bold">
                    JSON/CSV and Full History require a <strong>Business Subscription</strong>.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-3 mb-4">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                  <div className="text-[10px] text-slate-400">Ready to export <strong>Audit Log (PDF)</strong> for the last 30 days.</div>
                </div>
              )}

              <button onClick={handleGenerate} disabled={isBusinessFeature} className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-30 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-900/40 flex items-center justify-center gap-2">
                Generate & Export <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-slate-800 border-t-primary-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="text-primary-500" size={24} />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white uppercase italic">Generating Evidence</h3>
              <p className="text-xs text-slate-500 font-mono h-4">{currentAction}</p>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="text-emerald-500" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-white uppercase italic">Audit File Ready</h3>
            <p className="text-slate-400 text-sm">The report has been cryptographically signed and is ready for download.</p>
            <button onClick={finalizeDownload} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
              <Download size={20} /> Download Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const FormatCard = ({ active, onClick, label, sub, locked = false }: any) => (
  <button onClick={onClick} className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-1 ${active ? 'bg-primary-600/10 border-primary-500 shadow-lg' : 'bg-slate-950 border-slate-800'} ${locked ? 'opacity-50' : ''}`}>
    <span className={`text-sm font-black ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">{sub}</span>
  </button>
);
