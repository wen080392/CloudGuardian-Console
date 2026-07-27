
import React, { useState } from 'react';
import { Gavel, Plus, ShieldCheck, AlertCircle, Trash2, Edit3, Search, Filter, Globe, Lock, ShieldAlert, X } from 'lucide-react';
import { Policy, Severity } from '../types';

interface PolicyManagerProps {
  policies: Policy[];
  setPolicies: React.Dispatch<React.SetStateAction<Policy[]>>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  onTimeline: (event: any) => void;
}

export const PolicyManager: React.FC<PolicyManagerProps> = ({ policies, setPolicies, onNotify, onTimeline }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ name: '', description: '', framework: 'SOC2', severity: Severity.HIGH });

  const toggleStatus = (id: string) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const newStatus = p.status === 'active' ? 'draft' : 'active';
        onNotify(`Política ${p.name} agora está ${newStatus === 'active' ? 'Ativa' : 'em Rascunho'}`);
        return { ...p, status: newStatus as any };
      }
      return p;
    }));
  };

  const deletePolicy = (id: string) => {
    const policy = policies.find(p => p.id === id);
    setPolicies(prev => prev.filter(p => p.id !== id));
    onNotify(`Política ${policy?.name} removida`, 'error');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const createdPolicy: Policy = {
      id: `pol-${Date.now()}`,
      ...newPolicy,
      status: 'active'
    };
    setPolicies(prev => [createdPolicy, ...prev]);
    setIsModalOpen(false);
    onNotify("Nova política corporativa ativa!");
    onTimeline({
      type: 'POLICY',
      title: 'Nova Política Criada',
      description: `Governança atualizada: ${createdPolicy.name}`,
      severity: Severity.LOW
    });
    setNewPolicy({ name: '', description: '', framework: 'SOC2', severity: Severity.HIGH });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Policy Manager</h2>
          <p className="text-slate-400 text-sm italic">Governança Corporativa como Código (OPA / Rego Patterns).</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/30 active:scale-95"
        >
          <Plus size={16} /> Criar Nova Política
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Políticas Ativas" value={policies.filter(p => p.status === 'active').length} icon={<ShieldCheck className="text-emerald-500" />} />
        <StatCard label="Em Rascunho" value={policies.filter(p => p.status === 'draft').length} icon={<Edit3 className="text-slate-500" />} />
        <StatCard label="Violações Recentes" value="0" icon={<ShieldAlert className="text-red-500" />} />
        <StatCard label="Cobertura IaC" value="100%" icon={<Globe className="text-primary-500" />} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Política</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Framework</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Severidade</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {policies.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-xs text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">{p.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-black px-2 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700 uppercase tracking-tighter">{p.framework}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${
                      p.severity === Severity.CRITICAL ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                      p.severity === Severity.HIGH ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>{p.severity}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(p.id)}
                      className="flex items-center gap-2 group/btn"
                    >
                       <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'}`}></div>
                       <span className="text-[10px] font-bold text-slate-400 capitalize group-hover/btn:text-white transition-colors">{p.status}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => deletePolicy(p.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-600 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[32px] shadow-2xl p-8 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20}/></button>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6">Nova Política de Segurança</h3>
              <form onSubmit={handleCreate} className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome da Regra</label>
                    <input 
                      required
                      value={newPolicy.name}
                      onChange={e => setNewPolicy({...newPolicy, name: e.target.value})}
                      placeholder="Ex: No Public Database Access"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição Técnica</label>
                    <textarea 
                      required
                      value={newPolicy.description}
                      onChange={e => setNewPolicy({...newPolicy, description: e.target.value})}
                      placeholder="Descreva o que deve ser bloqueado..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 h-24"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Framework</label>
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                          value={newPolicy.framework}
                          onChange={e => setNewPolicy({...newPolicy, framework: e.target.value})}
                        >
                          <option>SOC2</option>
                          <option>ISO27001</option>
                          <option>PCI-DSS</option>
                          <option>Cost Control</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Severidade</label>
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                          value={newPolicy.severity}
                          onChange={e => setNewPolicy({...newPolicy, severity: e.target.value as Severity})}
                        >
                          <option value={Severity.LOW}>LOW</option>
                          <option value={Severity.MEDIUM}>MEDIUM</option>
                          <option value={Severity.HIGH}>HIGH</option>
                          <option value={Severity.CRITICAL}>CRITICAL</option>
                        </select>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-900/30">
                    Ativar Política Agora
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between group hover:border-slate-700 transition-all">
    <div>
      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-black text-white">{value}</div>
    </div>
    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 group-hover:scale-110 transition-transform">{icon}</div>
  </div>
);
