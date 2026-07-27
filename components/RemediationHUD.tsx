
import React from 'react';
import { Loader2, GitPullRequest, CheckCircle2, Globe, Shield, Terminal, ArrowRight, X } from 'lucide-react';

interface RemediationHUDProps {
  status: 'initializing' | 'patching' | 'pushing' | 'completed';
  prUrl?: string;
  branch?: string;
  onClose: () => void;
}

export const RemediationHUD: React.FC<RemediationHUDProps> = ({ status, prUrl, branch, onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[48px] shadow-[0_0_100px_rgba(37,99,235,0.2)] p-12 relative overflow-hidden flex flex-col items-center text-center gap-8 border-t-primary-500 border-t-4">
        
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="relative">
          <div className={`w-24 h-24 rounded-full bg-primary-600/10 border-2 flex items-center justify-center transition-all duration-700 ${status === 'completed' ? 'scale-110 border-emerald-500 bg-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'border-primary-500 animate-pulse'}`}>
             {status === 'completed' ? <CheckCircle2 size={48} className="text-emerald-500" /> : <GitPullRequest size={48} className="text-primary-500" />}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            {status === 'completed' ? 'Remediation <span class="text-emerald-500">Live</span>' : 'Autonomous <span class="text-primary-500">Remediation</span>'}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
            {status === 'initializing' && 'Booting Git Engine...'}
            {status === 'patching' && 'Applying AI Security Patch...'}
            {status === 'pushing' && 'Opening Remote Pull Request...'}
            {status === 'completed' && 'Code Integrity Restored'}
          </p>
        </div>

        <div className="w-full space-y-4">
           <StepRow active={true} label="HCL Analysis" sub="Success" />
           <StepRow active={status !== 'initializing'} label="Branch Provisioning" sub={branch || 'Pending...'} />
           <StepRow active={status === 'pushing' || status === 'completed'} label="Commit Signature" sub="Verified AI Signature" />
           <StepRow active={status === 'completed'} label="PR Integration" sub={status === 'completed' ? 'Open for Review' : 'Waiting...'} />
        </div>

        {status === 'completed' && (
          <div className="w-full animate-in zoom-in-95 duration-500">
            <a 
              href={prUrl} 
              target="_blank" 
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-3 active:scale-95"
            >
              <Terminal size={18} /> Review on GitHub <ArrowRight size={18} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const StepRow = ({ active, label, sub }: any) => (
  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${active ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-30'}`}>
     <div className="flex items-center gap-3">
        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
        <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
     </div>
     <span className="text-[10px] font-mono text-slate-500">{sub}</span>
  </div>
);
