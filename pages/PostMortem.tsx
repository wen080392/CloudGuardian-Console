
import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, History, Search, ArrowLeft, 
  Download, Loader2, Target, Zap, AlertCircle, Lock, 
  Terminal, Share2, Scale, CheckCircle2, X
} from 'lucide-react';
import { Vulnerability, Severity } from '../types';
import { API } from '../services/backend';

interface PostMortemProps {
  incident: Vulnerability | null;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const PostMortem: React.FC<PostMortemProps> = ({ incident, onClose, onNotify }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sealed, setSealed] = useState(false);

  useEffect(() => {
    if (incident) loadAnalysis();
  }, [incident]);

  const loadAnalysis = async () => {
    setLoading(true);
    const data = await API.generateRootCauseAnalysis(incident!);
    setAnalysis(data);
    setLoading(false);
  };

  const handleSealReport = () => {
    setSealed(true);
    onNotify("Relatório de Post-Mortem selado e assinado digitalmente.");
    API.logEvent({
      type: 'COMPLIANCE',
      title: 'Evidência Forense Selada',
      description: `RCA para o incidente ${incident?.id} arquivado com hash de integridade.`,
      severity: Severity.LOW
    });
  };

  if (!incident) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32 relative">
      <header className="flex justify-between items-start border-b border-white/5 pb-12">
        <div className="space-y-4">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Overview
          </button>
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
              Forensic <span className="text-primary-500">Post-Mortem</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
              Incident Management Log :: Case #{incident.id.slice(-6)}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
           {!sealed ? (
             <button 
               onClick={handleSealReport}
               className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-900/40 transition-all"
             >
               Selar Relatório
             </button>
           ) : (
             <div className="bg-emerald-500/10 border border-emerald-500/30 px-6 py-3 rounded-2xl flex items-center gap-3 text-emerald-500 animate-in zoom-in">
                <ShieldCheck size={18} />
                <span className="text-[9px] font-black uppercase tracking-widest">Integridade Verificada</span>
             </div>
           )}
           <button className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-slate-400">
             <Download size={20} />
           </button>
        </div>
      </header>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-6">
           <Loader2 className="animate-spin text-primary-500" size={48} />
           <div className="text-center">
             <p className="text-white font-black uppercase text-xs tracking-widest mb-1">Iniciando Reconstituição por IA</p>
             <p className="text-[10px] text-slate-500 font-mono italic">Analisando logs de contenção e telemetria de rede...</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-6 duration-700">
          
          {/* Main Analysis Column */}
          <div className="lg:col-span-8 space-y-12">
            <section className="bg-white/[0.02] border border-white/5 rounded-[48px] p-10 space-y-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-primary-500/50"></div>
               <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <Target size={18} className="text-primary-500" /> Executive Summary
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium italic">
                    "{analysis.summary}"
                  </p>
               </div>

               <div className="space-y-4 pt-4">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <AlertCircle size={18} className="text-red-500" /> Root Cause Identification
                  </h3>
                  <div className="p-6 bg-slate-950/60 border border-white/5 rounded-3xl">
                     <p className="text-xs text-slate-500 leading-relaxed font-mono">
                        {analysis.rootCause}
                     </p>
                  </div>
               </div>

               <div className="space-y-4 pt-4">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <Scale size={18} className="text-emerald-500" /> Prevention Strategy
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {analysis.prevention.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                         <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                         <span className="text-[11px] text-slate-300 font-bold uppercase tracking-tight">{item}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                <History size={18} /> Containment Timeline
              </h3>
              <div className="space-y-3">
                {incident.containmentLog?.map((log, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-900 border border-white/5 rounded-2xl group hover:border-primary-500/20 transition-all">
                     <div className="text-[10px] text-slate-700 font-mono">0{i+1}</div>
                     <p className="text-[11px] text-slate-400 font-mono italic">{log}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Forensic Metadata Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="neo-card rounded-[40px] p-8 space-y-8 border border-white/5 bg-slate-900/60 shadow-2xl">
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                 <Terminal size={14} className="text-primary-500" /> Evidence Integrity
               </h3>
               
               <div className="space-y-6">
                  <div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Resolution Time</span>
                    <div className="text-2xl font-black text-white italic">4m 22s</div>
                    <div className="text-[9px] text-emerald-500 font-bold uppercase mt-1">98% Faster than avg.</div>
                  </div>

                  <div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Evidence Hash</span>
                    <code className="text-[9px] text-primary-400 font-mono break-all bg-black/40 p-4 rounded-2xl block border border-white/5">
                      {analysis.auditEvidenceHash}
                    </code>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase mb-4">
                      <span>Compliance Tag</span>
                      <span className="text-white">SOC2_CC7.3</span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed font-bold uppercase">
                      Este documento cumpre com o requerimento de monitoramento de segurança e resposta a incidentes.
                    </p>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[40px] flex flex-col gap-6">
               <div className="flex items-center gap-3">
                 <Share2 size={24} className="text-indigo-400" />
                 <h4 className="text-xs font-black text-white uppercase tracking-widest italic">Stakeholder Sync</h4>
               </div>
               <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase">
                 Notificar automaticamente o CISO e o time de conformidade sobre a resolução deste incidente.
               </p>
               <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-900/20 active:scale-95">
                  Distribute RCA Report
               </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
