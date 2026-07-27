
import React, { useState, useEffect, useRef } from 'react';
import { 
  FlaskConical, Play, CheckCircle2, XCircle, AlertTriangle, 
  Terminal, ShieldCheck, Loader2, ChevronRight, Zap, Target,
  Cpu, Lock, Search, History, RefreshCw, Bug
} from 'lucide-react';
import { Severity, SecurityTest } from '../types';
import { API } from '../services/backend';

export const SecurityTesting: React.FC = () => {
  const [tests, setTests] = useState<SecurityTest[]>([
    { id: 'test-1', name: 'Infrastructure Unit Test (Checkov)', category: 'unit', status: 'idle', coverage: 92 },
    { id: 'test-2', name: 'Identity & Access Simulation', category: 'pentest', status: 'passed', lastRun: '2h ago', coverage: 100 },
    { id: 'test-3', name: 'Network Perimeter Fuzzing', category: 'dast', status: 'failed', lastRun: '15m ago', coverage: 45 },
    { id: 'test-4', name: 'Secret Exfiltration Attempt', category: 'pentest', status: 'idle', coverage: 88 },
  ]);
  
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setActiveLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-10));
  };

  const runTest = async (id: string) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, status: 'running' } : t));
    addLog(`Iniciando teste: ${tests.find(t => t.id === id)?.name}...`);
    
    await new Promise(r => setTimeout(r, 1500));
    
    const resultStatus = Math.random() > 0.2 ? 'passed' : 'failed';
    setTests(prev => prev.map(t => t.id === id ? { 
      ...t, 
      status: resultStatus as any, 
      lastRun: 'Just now',
      coverage: Math.floor(Math.random() * 20) + 80 
    } : t));
    
    addLog(`Resultado ${id}: ${resultStatus.toUpperCase()}`);
    
    API.logEvent({
      type: 'TEST',
      title: 'Security Test Executed',
      description: `O teste de ${id} foi concluído com status ${resultStatus}.`,
      severity: resultStatus === 'failed' ? Severity.HIGH : Severity.LOW
    });
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    setActiveLogs(["[SYSTEM] Initializing Guardian Test Suite v4.2..."]);
    
    for (const test of tests) {
      await runTest(test.id);
    }
    
    setIsRunningAll(false);
    addLog("[SYSTEM] All tests completed.");
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeLogs]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FlaskConical size={12} className="text-primary-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Guardian Test Lab</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
            Security <span className="text-primary-500">Testing Lab</span>
          </h2>
        </div>
        
        <button 
          onClick={runAllTests} 
          disabled={isRunningAll}
          className="flex items-center gap-3 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/40 disabled:opacity-50"
        >
          {isRunningAll ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
          Run Full Suite
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Test Cards Area */}
        <div className="lg:col-span-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tests.map(test => (
                <div key={test.id} className="neo-card rounded-[32px] p-8 space-y-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Bug size={64} />
                   </div>
                   
                   <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-2xl border ${getStatusColor(test.status)}`}>
                         {test.status === 'running' ? <Loader2 className="animate-spin" size={24} /> : <FlaskConical size={24} />}
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Coverage</div>
                         <div className="text-2xl font-black text-white">{test.coverage}%</div>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <h4 className="text-lg font-black text-white uppercase italic tracking-tight">{test.name}</h4>
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                         <span>Engine: {test.category.toUpperCase()}</span>
                         <span>•</span>
                         <span>{test.lastRun || 'Never run'}</span>
                      </div>
                   </div>

                   <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusBadgeColor(test.status)}`}>
                        {test.status}
                      </span>
                      <button 
                        onClick={() => runTest(test.id)}
                        disabled={test.status === 'running'}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-primary-400 hover:text-white transition-all disabled:opacity-30"
                      >
                         <Play size={14} fill="currentColor" />
                      </button>
                   </div>
                </div>
              ))}
           </div>

           {/* Terminal Window */}
           <section className="bg-slate-950 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="bg-slate-900/60 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Terminal size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Console Output</span>
                 </div>
                 <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20"></div>
                 </div>
              </div>
              <div className="p-8 h-48 font-mono text-xs text-emerald-500/80 space-y-2 overflow-y-auto custom-scrollbar bg-black/40">
                 {activeLogs.length === 0 ? (
                   <div className="text-slate-800 italic uppercase tracking-widest py-10 text-center opacity-30">Waiting for instructions...</div>
                 ) : (
                   activeLogs.map((log, i) => (
                     <div key={i} className="flex gap-4">
                        <span className="text-slate-800">#</span>
                        <span className="flex-1">{log}</span>
                     </div>
                   ))
                 )}
                 <div ref={logEndRef} />
              </div>
           </section>
        </div>

        {/* Lab Stats Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <section className="neo-card rounded-[40px] p-8 space-y-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary-500/5 pointer-events-none"></div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Target size={18} className="text-primary-500" /> Testing Metrics
              </h3>
              
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Coverage</span>
                    <span className="text-2xl font-black text-emerald-500">86.4%</span>
                 </div>
                 <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" style={{ width: '86%' }}></div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                 <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-center">
                    <div className="text-xl font-black text-white">12</div>
                    <div className="text-[8px] font-black text-slate-600 uppercase">Simulations</div>
                 </div>
                 <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-center">
                    <div className="text-xl font-black text-red-500">01</div>
                    <div className="text-[8px] font-black text-slate-600 uppercase">Failures</div>
                 </div>
              </div>
           </section>

           <section className="neo-card rounded-[40px] p-8 space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Engines</h3>
              <div className="space-y-4">
                 <EngineRow name="Gemini Reasoning" status="active" />
                 <EngineRow name="Checkov IaC" status="active" />
                 <EngineRow name="OWASP ZAP Core" status="standby" />
                 <EngineRow name="TFLint Linter" status="active" />
              </div>
           </section>

           <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900/20 border border-indigo-500/20 p-8 rounded-[40px] space-y-4">
              <Lock size={24} className="text-primary-400" />
              <h4 className="text-sm font-black text-white uppercase italic">Audit Certification</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase">
                Estes testes são exportáveis como prova técnica para auditorias SOC2 (Controle CC6.8).
              </p>
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all">
                 Generate Compliance Evidence
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const EngineRow = ({ name, status }: any) => (
  <div className="flex items-center justify-between group">
     <div className="flex items-center gap-3">
        <Cpu size={12} className="text-slate-600 group-hover:text-primary-500 transition-colors" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{name}</span>
     </div>
     <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`}></div>
  </div>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'passed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'running': return 'bg-primary-500/10 text-primary-500 border-primary-500/20';
    default: return 'bg-slate-950 text-slate-600 border-white/5';
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'passed': return 'bg-emerald-500/20 text-emerald-400';
    case 'failed': return 'bg-red-500/20 text-red-400';
    case 'running': return 'bg-primary-500/20 text-primary-400';
    default: return 'bg-slate-800 text-slate-500';
  }
};
