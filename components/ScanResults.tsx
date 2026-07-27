
import React, { useState, useMemo } from 'react';
import { Vulnerability, Severity } from '../types';
import { AlertTriangle, ChevronDown, ChevronUp, Cpu, GitPullRequest, Loader2, Shield, Lock, Zap, Target, Globe, Layers, DollarSign, ArrowRight, Radar } from 'lucide-react';
import { API } from '../services/backend';
import { DiffViewer } from './DiffViewer';

interface ScanResultsProps {
  findings: Vulnerability[];
  codeContext: string;
  onApplyFix: (id: string, code: string) => void;
  onSimulateBlast?: (resourceId: string) => void;
}

export const ScanResults: React.FC<ScanResultsProps> = ({ findings, codeContext, onApplyFix, onSimulateBlast }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiFix, setAiFix] = useState<Record<string, string>>({});
  const [loadingFix, setLoadingFix] = useState<string | null>(null);
  const [committing, setCommitting] = useState<string | null>(null);

  const stats = useMemo(() => ({
    critical: findings.filter(f => f.severity === Severity.CRITICAL).length,
    high: findings.filter(f => f.severity === Severity.HIGH).length,
    finops: findings.filter(f => f.type === 'finops').length,
    total: findings.length
  }), [findings]);

  const handleGenerateFix = async (vuln: Vulnerability) => {
    setLoadingFix(vuln.id);
    try {
        const fix = await API.suggestFix(vuln.title, codeContext);
        const cleanFix = fix ? fix.replace(/```(hcl|terraform)?\n?|\n?```/g, '').trim() : "/* Erro ao gerar sugestão */";
        setAiFix(prev => ({ ...prev, [vuln.id]: cleanFix }));
    } catch (e) { 
        setAiFix(prev => ({ ...prev, [vuln.id]: "/* Erro crítico na comunicação com o motor de IA */" })); 
    }
    setLoadingFix(null);
  };

  const handleFixAndCommit = (vuln: Vulnerability) => {
    setCommitting(vuln.id);
    setTimeout(() => {
        onApplyFix(vuln.id, aiFix[vuln.id] || '');
        setCommitting(null);
        setExpandedId(null);
    }, 1800);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
           <span>Resultados do Scan</span>
           <span className="text-primary-400">{stats.total} Achados</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-slate-950 p-3 rounded-2xl text-center border border-red-500/10">
              <div className="text-xl font-black text-red-500">{stats.critical}</div>
              <div className="text-[8px] font-black text-slate-600 uppercase">Críticos</div>
           </div>
           <div className="bg-slate-950 p-3 rounded-2xl text-center border border-orange-500/10">
              <div className="text-xl font-black text-orange-500">{stats.high}</div>
              <div className="text-[8px] font-black text-slate-600 uppercase">Altos</div>
           </div>
           <div className="bg-slate-950 p-3 rounded-2xl text-center border border-emerald-500/10">
              <div className="text-xl font-black text-emerald-500">{stats.finops}</div>
              <div className="text-[8px] font-black text-slate-600 uppercase">FinOps</div>
           </div>
        </div>
      </div>

      <div className="space-y-3">
        {findings.map((f) => (
          <div key={f.id} className={`bg-slate-900 rounded-2xl border transition-all ${expandedId === f.id ? 'border-primary-500 shadow-2xl bg-slate-900' : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'}`}>
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${f.type === 'finops' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : (f.severity === Severity.CRITICAL ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-orange-500 bg-orange-500/10 border-orange-500/20')}`}>
                  {f.type === 'finops' ? <DollarSign size={16}/> : (f.severity === Severity.CRITICAL ? <Shield size={16}/> : <Target size={16}/>)}
                </div>
                <div>
                   <h4 className="font-bold text-xs text-slate-200">{f.title}</h4>
                   <p className="text-[9px] text-slate-500 font-mono uppercase">{f.resource}</p>
                </div>
              </div>
              {expandedId === f.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </div>
            {expandedId === f.id && (
              <div className="px-5 pb-5 pt-2 border-t border-slate-800/50 space-y-4 bg-slate-950/20">
                <p className="text-xs text-slate-400 italic">"{f.description}"</p>
                
                {onSimulateBlast && (
                  <button 
                    onClick={() => onSimulateBlast(f.resource)}
                    className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-[9px] font-black rounded-lg border border-red-500/20 flex items-center justify-center gap-2 uppercase tracking-widest transition-all"
                  >
                    <Radar size={12} className="animate-pulse" /> Simular Raio de Explosão
                  </button>
                )}

                <div className="flex flex-wrap gap-2">
                   {f.complianceMapping?.map(c => <span key={c} className="text-[8px] font-black text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">{c}</span>)}
                   {f.type === 'finops' && <span className="text-[8px] font-black text-primary-400 bg-primary-500/5 px-2 py-0.5 rounded border border-primary-500/10">FINOPS_SAVING</span>}
                </div>

                {!aiFix[f.id] ? (
                  <button onClick={() => handleGenerateFix(f)} disabled={loadingFix === f.id} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest border border-slate-700 transition-all active:scale-95">
                    {loadingFix === f.id ? <Loader2 className="animate-spin" size={14}/> : <Zap size={14} className="text-amber-400"/>}
                    {loadingFix === f.id ? 'Analisando...' : 'Gerar Remediação IA'}
                  </button>
                ) : (
                  <div className="space-y-3 animate-in fade-in">
                    <DiffViewer 
                      original={codeContext.split('\n').filter(l => l.includes(f.resource.split('.')[1])).join('\n') || '/* Código Original */'} 
                      fixed={aiFix[f.id]} 
                    />
                    <button onClick={() => handleFixAndCommit(f)} disabled={committing === f.id} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-emerald-900/30 transition-all active:scale-95">
                      {committing === f.id ? <Loader2 className="animate-spin" size={16}/> : <GitPullRequest size={16}/>}
                      {committing === f.id ? 'Sincronizando...' : 'Aplicar Correção IA'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
