
import React, { useState, useEffect, useRef } from 'react';
import { 
  Radar, ShieldAlert, Skull, Activity, Zap, Lock, 
  Terminal, X, Loader2, AlertTriangle, ShieldCheck, 
  History, Power, Globe, Database, UserX, CheckCircle
} from 'lucide-react';
import { Vulnerability, Severity } from '../types';
import { API } from '../services/backend';

interface WarRoomProps {
  incident: Vulnerability | null;
  onNotify: (msg: string) => void;
  onClose: () => void;
  onResolve: (incident: Vulnerability, logs: string[]) => void;
}

export const WarRoom: React.FC<WarRoomProps> = ({ incident, onNotify, onClose, onResolve }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [tactics, setTactics] = useState<any[]>([]);
  const [loadingTactics, setLoadingTactics] = useState(true);
  const [executing, setExecuting] = useState<number | null>(null);
  const [canResolve, setCanResolve] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[TACTICAL_INTEL] ${new Date().toLocaleTimeString()} :: ${msg}`].slice(-15));
  };

  useEffect(() => {
    if (incident) {
      addLog(`INCIDENT DETECTED: ${incident.title}`);
      addLog(`PRIMARY RESOURCE AT RISK: ${incident.resource}`);
      loadTactics();
    }
  }, [incident]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadTactics = async () => {
    if (!incident) return;
    setLoadingTactics(true);
    const result = await API.generateDefensiveTactics(incident.title, incident.resource);
    setTactics(result);
    setLoadingTactics(false);
  };

  const executeTactic = async (id: number, title: string) => {
    setExecuting(id);
    addLog(`INITIALIZING COUNTERMEASURE: ${title.toUpperCase()}`);
    
    await new Promise(r => setTimeout(r, 2000));
    
    addLog(`DEFENSIVE ACTION APPLIED: ${title} - SUCCESS`);
    onNotify(`Tática de contenção aplicada: ${title}`);
    
    API.logEvent({
      type: 'INCIDENT',
      title: 'Contenção Defensiva',
      description: `Ação de bloqueio realizada: ${title} no recurso ${incident?.resource}`,
      severity: Severity.MEDIUM
    });
    
    setExecuting(null);
    setCanResolve(true);
  };

  if (!incident) return null;

  return (
    <div className="p-8 h-[calc(100vh-100px)] max-w-7xl mx-auto flex flex-col space-y-8 animate-in fade-in duration-1000 relative overflow-hidden">
      
      <div className="absolute inset-0 bg-red-950/5 pointer-events-none">
         <div className="absolute inset-0 opacity-[0.02]" style={{ 
            backgroundImage: 'radial-gradient(#ff0000 1px, transparent 1px)', 
            backgroundSize: '30px 30px' 
         }}></div>
      </div>

      <header className="flex justify-between items-start relative z-20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_#ef4444]"></span>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Active Incident Responder v4.2</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
            Defensive <span className="text-red-500">War Room</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
           {canResolve && (
              <button 
                onClick={() => onResolve(incident, logs)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/30 animate-in zoom-in"
              >
                <CheckCircle size={18} /> Finalizar Protocolo
              </button>
           )}
           <div className="bg-red-500/10 border border-red-500/30 px-6 py-3 rounded-2xl flex items-center gap-4">
              <div className="text-right">
                 <div className="text-[8px] font-black text-red-500 uppercase tracking-widest">Incident Level</div>
                 <div className="text-xl font-black text-white uppercase italic">{incident.severity}</div>
              </div>
              <ShieldAlert size={32} className="text-red-500 animate-pulse" />
           </div>
           <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all">
              <X size={24} />
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        
        <div className="lg:col-span-4 flex flex-col space-y-8 overflow-hidden">
           <section className="neo-card rounded-[40px] p-8 border-red-500/10 bg-slate-900/60 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <Skull size={80} className="text-red-500" />
              </div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 mb-6 relative z-10">
                 <Activity size={18} className="text-red-500" /> Threat Intelligence
              </h3>
              <div className="space-y-4 relative z-10">
                 <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Incident Type</span>
                    <p className="text-sm font-bold text-white uppercase italic">{incident.title}</p>
                 </div>
                 <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Target Resource</span>
                    <code className="text-[10px] text-red-400 font-mono bg-red-500/5 px-2 py-1 rounded border border-red-500/10 block">{incident.resource}</code>
                 </div>
                 <div className="pt-4">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Blast Radius Probability</span>
                       <span className="text-red-500 font-black text-xs">{incident.impactScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-red-500 shadow-[0_0_10px_#ef4444]" style={{ width: `${incident.impactScore}%` }}></div>
                    </div>
                 </div>
              </div>
           </section>

           <section className="bg-slate-950 border border-red-500/20 rounded-[40px] flex-1 flex flex-col overflow-hidden shadow-2xl">
              <div className="bg-slate-900/40 px-8 py-4 border-b border-red-500/10 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Terminal size={14} className="text-red-500" />
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Tactical Telemetry</span>
                 </div>
                 <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 </div>
              </div>
              <div className="flex-1 p-8 font-mono text-[10px] text-red-500/70 space-y-2 overflow-y-auto custom-scrollbar italic leading-relaxed">
                 {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 animate-in slide-in-from-left-2">
                       <span className="text-red-900/40">#</span>
                       <span>{log}</span>
                    </div>
                 ))}
                 <div ref={logEndRef} />
              </div>
           </section>
        </div>

        <div className="lg:col-span-8 space-y-8 flex flex-col overflow-hidden">
           <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-[64px] p-12 flex flex-col space-y-10 relative overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="space-y-2">
                 <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Active <span className="text-red-500">Containment</span></h3>
                 <p className="text-slate-500 text-xs font-medium max-w-xl">
                    Selecione ações imediatas de proteção para isolar o recurso vulnerável e impedir a escalação do ataque.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {loadingTactics ? (
                    Array.from({ length: 4 }).map((_, i) => (
                       <div key={i} className="h-32 bg-white/5 rounded-[32px] animate-pulse border border-white/5"></div>
                    ))
                 ) : (
                    tactics.map((t) => (
                       <button 
                          key={t.id}
                          onClick={() => executeTactic(t.id, t.title)}
                          disabled={executing !== null}
                          className={`p-8 bg-slate-950 border border-white/5 rounded-[40px] text-left group transition-all hover:border-red-500/30 hover:-translate-y-1 relative overflow-hidden ${executing === t.id ? 'ring-2 ring-red-500' : ''}`}
                       >
                          <div className="flex justify-between items-start mb-4">
                             <div className={`p-4 rounded-2xl ${executing === t.id ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500'} transition-all`}>
                                {executing === t.id ? <Loader2 className="animate-spin" size={24} /> : (t.id === 1 ? <Lock size={24} /> : <UserX size={24} />)}
                             </div>
                             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Counter-Action {t.id}</span>
                          </div>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2 group-hover:text-red-500 transition-colors">{t.title}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">{t.desc}</p>
                          
                          {executing === t.id && (
                             <div className="absolute inset-0 bg-red-500/5 flex items-center justify-center">
                                <Zap className="text-red-500 animate-ping" size={48} />
                             </div>
                          )}
                       </button>
                    ))
                 )}
              </div>

              <div className="mt-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Globe size={12} className="text-red-500"/> Global Lock: Disabled</span>
                    <span className="flex items-center gap-2"><Database size={12} className="text-red-500"/> Snapshots: Available</span>
                 </div>
                 
                 <div className="flex gap-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all">
                       Report False Positive
                    </button>
                    <button 
                       onClick={() => onNotify("Forcing deployment isolation protocol...")}
                       className="flex-1 md:flex-none px-10 py-4 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                       <Power size={14} /> Full Isolation Protocol
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
