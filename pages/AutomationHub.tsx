
import React, { useState } from 'react';
import { 
  Workflow, Zap, Play, Pause, Plus, MoreHorizontal, 
  ArrowRight, ShieldAlert, Lock, Bell, Server, Database, 
  CheckCircle2, XCircle, Clock, Activity, Settings, GitBranch
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  status: 'active' | 'paused';
  lastRun: string;
  runs: number;
}

const INITIAL_WORKFLOWS: Workflow[] = [
  { id: 'wf-1', name: 'Ransomware Containment Protocol', trigger: 'Sentinel: Ransomware Pattern', actions: ['Isolate Instance', 'Snapshot Volume', 'Alert SOC Team'], status: 'active', lastRun: '10m ago', runs: 12 },
  { id: 'wf-2', name: 'Public S3 Auto-Remediation', trigger: 'Scanner: Public Bucket', actions: ['Apply Private ACL', 'Enable Encryption', 'Notify Slack'], status: 'active', lastRun: '2h ago', runs: 45 },
  { id: 'wf-3', name: 'IAM Privilege Escalation Lock', trigger: 'Drift: Admin Access Added', actions: ['Revoke Access', 'Rotate Keys'], status: 'paused', lastRun: '2d ago', runs: 3 },
];

export const AutomationHub: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(INITIAL_WORKFLOWS[0]);
  const [isSimulating, setIsSimulating] = useState(false);

  const toggleStatus = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w));
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32 h-[calc(100vh-2rem)] flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Workflow size={12} className="text-primary-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">SOAR Engine v2.4</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
            Automation <span className="text-primary-500">Workflows</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium italic">
            Orquestração de resposta a incidentes e automação de segurança (If This Then That).
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/40 active:scale-95 group">
           <Plus size={16} className="group-hover:rotate-90 transition-transform" /> New Workflow
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        {/* Left Column: Workflow List */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
           <div className="flex-1 bg-slate-900 border border-white/5 rounded-[40px] p-6 space-y-4 overflow-y-auto custom-scrollbar shadow-2xl">
              <div className="flex justify-between items-center px-2">
                 <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Active Playbooks</h3>
                 <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">{workflows.length} Total</span>
              </div>
              
              <div className="space-y-3">
                 {workflows.map(wf => (
                    <div 
                      key={wf.id}
                      onClick={() => setSelectedWorkflow(wf)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${
                        selectedWorkflow?.id === wf.id 
                        ? 'bg-primary-600/10 border-primary-500 shadow-lg shadow-primary-900/20' 
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-3">
                          <div className={`p-2 rounded-xl ${wf.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                             <Zap size={16} />
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-mono text-slate-500">{wf.lastRun}</span>
                             <button onClick={(e) => { e.stopPropagation(); toggleStatus(wf.id); }} className="text-slate-500 hover:text-white transition-colors">
                                {wf.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                             </button>
                          </div>
                       </div>
                       
                       <h4 className={`text-sm font-bold leading-tight mb-2 ${selectedWorkflow?.id === wf.id ? 'text-white' : 'text-slate-300'}`}>{wf.name}</h4>
                       
                       <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                          <GitBranch size={12} />
                          <span>{wf.runs} Executions</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Column: Visual Editor */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
           {selectedWorkflow ? (
             <div className="flex-1 bg-[#0f172a] border border-slate-800 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }}></div>

                {/* Toolbar */}
                <div className="p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-md flex justify-between items-center relative z-10">
                   <div>
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{selectedWorkflow.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className={`w-2 h-2 rounded-full ${selectedWorkflow.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedWorkflow.status === 'active' ? 'Live Monitoring' : 'Maintenance Mode'}</span>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"><Settings size={18}/></button>
                      <button 
                        onClick={runSimulation}
                        disabled={isSimulating}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                      >
                         {isSimulating ? <Clock size={14} className="animate-spin"/> : <Play size={14} fill="currentColor"/>}
                         {isSimulating ? 'Executing...' : 'Test Run'}
                      </button>
                   </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative overflow-y-auto custom-scrollbar p-12 flex flex-col items-center gap-8 z-10">
                   
                   {/* Trigger Node */}
                   <div className="w-80 p-5 bg-slate-900 border border-red-500/30 rounded-3xl shadow-[0_0_30px_rgba(239,68,68,0.1)] relative group cursor-pointer hover:-translate-y-1 transition-all">
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center z-20">
                         <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Trigger Event</span>
                         <ShieldAlert size={14} className="text-red-500" />
                      </div>
                      <div className="text-sm font-bold text-white">{selectedWorkflow.trigger}</div>
                      
                      {/* Connector Line */}
                      <div className="absolute left-1/2 -bottom-8 w-0.5 h-8 bg-slate-700 group-hover:bg-primary-500 transition-colors"></div>
                      <div className="absolute left-1/2 -bottom-2 w-2 h-2 bg-slate-700 rounded-full -translate-x-[3px] group-hover:bg-primary-500 transition-colors"></div>
                   </div>

                   {/* Logic/Condition Node (Static for Demo) */}
                   <div className="w-64 p-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-center backdrop-blur-sm relative group">
                      <span className="text-[10px] font-mono text-slate-400">IF severity &gt;= HIGH</span>
                      <div className="absolute left-1/2 -bottom-8 w-0.5 h-8 bg-slate-700 group-hover:bg-primary-500 transition-colors"></div>
                   </div>

                   {/* Actions List */}
                   {selectedWorkflow.actions.map((action, idx) => (
                      <div key={idx} className="w-80 p-5 bg-slate-900 border border-white/10 rounded-3xl shadow-xl relative group cursor-pointer hover:border-primary-500/50 hover:bg-slate-800 transition-all hover:-translate-y-1">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-primary-400 uppercase tracking-widest">Step {idx + 1}</span>
                            {idx === 0 ? <Lock size={14} className="text-slate-500"/> : idx === 1 ? <Database size={14} className="text-slate-500"/> : <Bell size={14} className="text-slate-500"/>}
                         </div>
                         <div className="text-sm font-bold text-white">{action}</div>
                         {idx < selectedWorkflow.actions.length - 1 && (
                            <div className="absolute left-1/2 -bottom-8 w-0.5 h-8 bg-slate-700 group-hover:bg-primary-500 transition-colors"></div>
                         )}
                         {idx < selectedWorkflow.actions.length - 1 && (
                            <div className="absolute left-1/2 -bottom-2 w-2 h-2 bg-slate-700 rounded-full -translate-x-[3px] group-hover:bg-primary-500 transition-colors"></div>
                         )}
                      </div>
                   ))}

                   {/* End Node */}
                   <div className="w-32 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-center text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      Workflow End
                   </div>
                </div>

                {/* Execution Log (Bottom Panel) */}
                <div className="h-48 border-t border-white/5 bg-slate-950/50 backdrop-blur-md flex flex-col relative z-20">
                   <div className="px-6 py-3 border-b border-white/5 flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <Activity size={12} /> Execution Logs
                      </h4>
                      <button className="text-[9px] font-bold text-primary-500 hover:text-white transition-colors">View All Logs</button>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2 font-mono text-[10px]">
                      {isSimulating && (
                         <div className="flex items-center gap-3 text-primary-400 animate-pulse">
                            <Clock size={10} />
                            <span>[SIMULATION] Triggering workflow event...</span>
                         </div>
                      )}
                      <div className="flex items-center gap-3 text-emerald-500">
                         <CheckCircle2 size={10} />
                         <span className="text-slate-400">[10:42:15]</span>
                         <span>Action 'Snapshot Volume' completed successfully. (vol-0af123...)</span>
                      </div>
                      <div className="flex items-center gap-3 text-emerald-500">
                         <CheckCircle2 size={10} />
                         <span className="text-slate-400">[10:42:12]</span>
                         <span>Instance i-0b82f stopped via EC2 API.</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                         <Zap size={10} />
                         <span className="text-slate-500">[10:42:10]</span>
                         <span>Workflow triggered by Sentinel Event ID #9921</span>
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                <Workflow size={64} className="mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">Select a workflow to edit</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
