import React from 'react';
import { Lock, Info, ExternalLink } from 'lucide-react';

export const AuditorBanner: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="bg-amber-500 p-1 rounded shadow-lg shadow-amber-500/20">
          <Lock size={12} className="text-slate-950" />
        </div>
        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
          Modo Auditor Ativado — Visualização Somente Leitura
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 font-medium">
          <Info size={12} />
          <span>Ações de modificação e execução de infraestrutura estão bloqueadas.</span>
        </div>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          className="flex items-center gap-1 text-[10px] text-amber-500/80 hover:text-amber-400 font-bold transition-colors"
        >
          Compliance Policy
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
};