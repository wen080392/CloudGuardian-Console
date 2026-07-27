
import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertCircle, ArrowRight, ShieldCheck, Loader2, CheckCircle, Zap, Globe, Database, X, FileDiff } from 'lucide-react';
import { DriftItem, Severity } from '../types';
import { API } from '../services/backend';

interface DriftProps {
  isAuditorMode?: boolean;
}

export const Drift: React.FC<DriftProps> = ({ isAuditorMode }) => {
  const [drifts, setDrifts] = useState<DriftItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [selectedDrift, setSelectedDrift] = useState<DriftItem | null>(null);

  useEffect(() => {
    loadDrifts();
  }, []);

  const loadDrifts = async () => {
    setScanning(true);
    const data = await API.fetchCloudDrifts();
    setDrifts(data);
    setScanning(false);
  };

  const handleSync = async () => {
    if (!selectedDrift) return;
    setSyncingId(selectedDrift.id);
    await API.resolveDrift(selectedDrift.id);
    setDrifts(prev => prev.filter(d => d.id !== selectedDrift.id));
    setSyncingId(null);
    setSelectedDrift(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* Diff Modal */}
      {selectedDrift && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
           <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-[48px] shadow-2xl p-10 relative flex flex-col gap-8">
              <button onClick={() => setSelectedDrift(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={24}/></button>
              
              <div className="space-y-2">
                 <div className="flex items-center gap-3 text-primary-500">
                    <FileDiff size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">State Reconciliation</span>
                 </div>
                 <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Review Changes</h3>
                 <p className="text-slate-500 text-xs">Confirmar esta ação irá sobrescrever o estado atual da nuvem com a configuração definida no Terraform.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl space-y-3">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Terraform (Desired)</div>
                    <div className="font-mono text-sm text-emerald-500 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                       {selectedDrift.terraformValue}
                    </div>
                 </div>
                 <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl space-y-3">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cloud (Actual)</div>
                    <div className="font-mono text-sm text-red-500 bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                       {selectedDrift.cloudValue}
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setSelectedDrift(null)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all text-[10px]">
                    Cancel
                 </button>
                 <button 
                    onClick={handleSync}
                    className="flex-1 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/30 text-[10px] flex items-center justify-center gap-2"
                 >
                    {syncingId === selectedDrift.id ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
                    {syncingId === selectedDrift.id ? 'Applying...' : 'Confirm Overwrite'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe size={12} className="text-primary-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Infrastructure Drift SDK</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic text-glow">
            Cloud <span className="text-primary-500">Divergence</span>
          </h2>
        </div>
        
        <button 
          onClick={loadDrifts} 
          disabled={scanning} 
          className="flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95"
        >
          {scanning ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          Refresh Cloud State
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {drifts.length === 0 && !scanning ? (
          <div className="neo-card border-dashed border-emerald-500/20 p-20 flex flex-col items-center justify-center rounded-[48px] animate-in zoom-in-95">
              <div className="p-6 bg-emerald-500/10 rounded-full mb-6">
                <ShieldCheck className="text-emerald-500" size={64} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">System is Synchronized</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-md text-center">Nenhuma divergência detectada entre seu código Terraform e os recursos reais na AWS/Azure.</p>
          </div>
        ) : (
          drifts.map((item) => (
            <div key={item.id} className="neo-card rounded-[32px] overflow-hidden group hover:border-primary-500/30 transition-all">
              <div className="bg-slate-900/60 p-6 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${item.severity === Severity.CRITICAL ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white uppercase tracking-tight">{item.resource}</span>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Provider ID: cloud-exec-822</div>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${item.severity === Severity.CRITICAL ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                      {item.severity} Risk
                    </span>
                    <div className="w-px h-6 bg-white/5"></div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Detected 4m ago</div>
                  </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-7 gap-6 items-center">
                  <div className="md:col-span-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Affected Property</span>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                        <Zap size={14} />
                      </div>
                      <code className="text-white font-mono text-sm">{item.property}</code>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">HCL Config (Desired)</span>
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 text-xs text-slate-400 font-mono shadow-inner">
                      {item.terraformValue}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="text-slate-700 animate-pulse" size={24} />
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-2">Cloud Status (Actual)</span>
                    <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/20 text-xs text-red-400 font-mono shadow-inner">
                      {item.cloudValue}
                    </div>
                  </div>
              </div>

              <div className="px-8 py-5 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2"><Database size={12}/> Region: us-east-1</span>
                    <span className="flex items-center gap-2"><Activity size={12}/> Monitoring: Enabled</span>
                  </div>
                  <button 
                    onClick={() => setSelectedDrift(item)} 
                    disabled={isAuditorMode || syncingId === item.id} 
                    className="flex items-center gap-2 px-10 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/30 disabled:opacity-50"
                  >
                    {syncingId === item.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14}/>}
                    {syncingId === item.id ? 'Syncing Infrastructure...' : 'Overwrite Cloud State'}
                  </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
