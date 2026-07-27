
import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';

interface DiffViewerProps {
  original: string;
  fixed: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ original, fixed }) => {
  const originalLines = original.split('\n');
  const fixedLines = fixed.split('\n');

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden font-mono text-[10px] shadow-inner">
      <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
        <span className="text-slate-500 uppercase font-black tracking-widest">IA Proposed Review</span>
        <div className="flex items-center gap-2">
            <span className="text-red-500 bg-red-500/10 px-1.5 rounded">-{originalLines.length} lines</span>
            <span className="text-emerald-500 bg-emerald-500/10 px-1.5 rounded">+{fixedLines.length} lines</span>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-800">
        <div className="p-4 space-y-0.5 opacity-60">
           {originalLines.map((line, i) => (
             <div key={i} className="flex gap-3 hover:bg-red-500/5">
               <span className="w-6 text-slate-700 text-right">{i+1}</span>
               <span className="text-red-400 truncate">{line}</span>
             </div>
           ))}
        </div>
        <div className="p-4 space-y-0.5">
           {fixedLines.map((line, i) => (
             <div key={i} className="flex gap-3 hover:bg-emerald-500/5">
               <span className="w-6 text-slate-700 text-right">{i+1}</span>
               <span className="text-emerald-400 truncate">{line}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
