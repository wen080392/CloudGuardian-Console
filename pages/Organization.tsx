
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Project, OrgMember, View } from '../types';
import { 
  Users, Briefcase, Plus, Shield, ShieldCheck, Mail, Clock, 
  MoreVertical, Search, Globe, ChevronRight, Loader2, UserPlus, 
  Key, Gavel, X, Zap, Cloud, Check
} from 'lucide-react';

interface OrganizationProps {
  onNavigate: (view: View) => void;
  onNotify: (msg: string) => void;
}

export const Organization: React.FC<OrganizationProps> = ({ onNavigate, onNotify }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    cloud: 'AWS',
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [p, m] = await Promise.all([dbService.getProjects(), dbService.getMembers()]);
    setProjects(p);
    setMembers(m);
    setLoading(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    // Added missing 'region' property to fix type error
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: newProject.name || 'Unnamed Project',
      cloud: newProject.cloud as any,
      region: 'us-east-1',
      status: 'active',
      lastScan: new Date().toISOString(),
      score: 100
    };

    await dbService.saveProject(project);
    await loadData();
    
    onNotify(`Ambiente ${project.name} provisionado com sucesso!`);
    setIsCreating(false);
    setIsModalOpen(false);
    setNewProject({ name: '', cloud: 'AWS', status: 'active' });
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary-500" size={48} />
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando Workspace...</span>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Key size={12} className="text-primary-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">RBAC & Workspace Governance</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
            Team <span className="text-primary-500">Workspace</span>
          </h2>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate('timeline')}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
          >
             Global Access Logs
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/40 active:scale-95"
          >
            <Plus size={16} /> New Environment
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
           <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Globe size={18} className="text-primary-500" /> Active Environments ({projects.length})
              </h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(project => (
                <div key={project.id} className="neo-card rounded-[40px] p-8 group relative overflow-hidden flex flex-col justify-between h-64 border border-white/5">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Shield size={100} />
                   </div>
                   
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                         <div className="p-4 bg-slate-900 rounded-[20px] border border-white/5 text-primary-400 group-hover:scale-110 transition-transform">
                            {project.cloud === 'AWS' ? <Globe size={28} /> : <ShieldCheck size={28} />}
                         </div>
                         <div className="text-right">
                            <div className={`text-4xl font-black ${project.score > 70 ? 'text-emerald-500' : 'text-red-500'}`}>{project.score}</div>
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Health Index</div>
                         </div>
                      </div>
                      
                      <div className="space-y-1">
                         <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">{project.name}</h4>
                         <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            <span className="text-primary-500">{project.cloud} Instance</span>
                            <span>•</span>
                            <span>{project.status === 'active' ? 'Prod-Ready' : 'Archived'}</span>
                         </div>
                      </div>
                   </div>

                   <div className="relative z-10 pt-6 border-t border-white/5 flex justify-between items-center">
                      <div className="flex -space-x-2">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                             {String.fromCharCode(64 + i)}
                           </div>
                         ))}
                      </div>
                      <button 
                        onClick={() => onNavigate('graph')}
                        className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors group/link"
                      >
                        Inspect Cluster <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Users size={18} className="text-indigo-500" /> Identity Hub ({members.length})
              </h3>
              <button className="p-2 bg-white/5 border border-white/5 rounded-xl text-primary-400 hover:text-white transition-all">
                 <UserPlus size={18} />
              </button>
            </div>
            
            <div className="neo-card rounded-[32px] overflow-hidden border border-white/5">
              {members.map((member, i) => (
                <div key={member.id} className={`p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors ${i !== members.length - 1 ? 'border-b border-white/5' : ''}`}>
                   <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-black text-xs text-white border border-white/10 shadow-lg">
                          {member.name[0]}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-slate-900 rounded-full"></div>
                      </div>
                      <div>
                         <div className="text-xs font-black text-white uppercase tracking-tight">{member.name}</div>
                         <div className="text-[10px] text-slate-500 font-bold truncate max-w-[140px]">{member.email}</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className={`text-[10px] font-black uppercase tracking-tighter ${member.role === 'admin' ? 'text-primary-500' : 'text-slate-500'}`}>{member.role}</div>
                      <div className="text-[9px] text-slate-600 font-black uppercase mt-0.5">{member.lastActive}</div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="neo-card rounded-[32px] p-8 space-y-6 bg-gradient-to-br from-indigo-950/20 to-slate-950/20 border border-indigo-500/10">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl">
                  <Gavel size={20} className="text-white" />
                </div>
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Global RBAC Policy</h4>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Políticas de acesso granular (Least Privilege) aplicadas em todos os recursos da organização via CloudGuardian IAM-Guard.
             </p>
             <div className="pt-4 flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                <span>Security Enforcement</span>
                <span className="text-emerald-500">Active</span>
             </div>
          </div>
        </div>
      </div>

      {/* MODAL: NEW ENVIRONMENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/5 w-full max-w-lg rounded-[48px] shadow-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-500"></div>
            
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <header className="mb-8 space-y-2">
              <div className="flex items-center gap-2 text-primary-400">
                <Zap size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Workspace Provisioner</span>
              </div>
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">New Environment</h3>
              <p className="text-xs text-slate-500 font-medium">Configure as credenciais de nuvem para o novo workspace.</p>
            </header>

            <form onSubmit={handleCreateProject} className="space-y-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Environment Name</label>
                  <input 
                    required
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                    placeholder="Ex: Production-Internal-Tools"
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-primary-500 shadow-inner"
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cloud Provider</label>
                  <div className="grid grid-cols-3 gap-3">
                    <CloudSelector 
                      active={newProject.cloud === 'AWS'} 
                      onClick={() => setNewProject({...newProject, cloud: 'AWS'})}
                      label="AWS"
                    />
                    <CloudSelector 
                      active={newProject.cloud === 'Azure'} 
                      onClick={() => setNewProject({...newProject, cloud: 'Azure'})}
                      label="Azure"
                    />
                    <CloudSelector 
                      active={newProject.cloud === 'GCP'} 
                      onClick={() => setNewProject({...newProject, cloud: 'GCP'})}
                      label="GCP"
                    />
                  </div>
               </div>

               <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 flex items-start gap-4">
                  <Shield className="text-primary-500 shrink-0 mt-1" size={20} />
                  <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase">
                    Ao criar um novo ambiente, o CloudGuardian irá disparar um scan inicial de drift e conformidade automaticamente.
                  </p>
               </div>

               <button 
                type="submit" 
                disabled={isCreating}
                className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-primary-900/40 flex items-center justify-center gap-2"
               >
                 {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                 {isCreating ? 'Provisioning...' : 'Provision Environment'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CloudSelector = ({ active, onClick, label }: any) => (
  <button 
    type="button"
    onClick={onClick}
    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
      active 
      ? 'bg-primary-500/10 border-primary-500 text-white' 
      : 'bg-slate-950 border-white/5 text-slate-600 hover:text-slate-400 hover:border-white/10'
    }`}
  >
    <Cloud size={20} />
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);