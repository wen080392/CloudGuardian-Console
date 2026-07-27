
import React, { useState } from 'react';
import { Bell, Search, User, Shield, Cloud, ChevronDown, Mic, Database, Menu, Command, Terminal, AlertTriangle, CheckCircle2, GitPullRequest, DollarSign, X, Lock } from 'lucide-react';
import { Project } from '../types';

interface HeaderProps {
  isAuditor: boolean;
  onToggleAuditor: () => void;
  notificationsCount: number;
  onToggleLiveAssistant: () => void;
  isLiveActive: boolean;
  activeProjectId: string | null;
  projects: Project[];
  onProjectChange: (id: string) => void;
  onOpenPalette: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
  onMobileMenuClick: () => void;
  onLockSession: () => void;
}

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'High Drift Detected', desc: 'Port 22 opened on sg-prod-db', time: '2m ago', type: 'risk' },
  { id: 2, title: 'Auto-PR Merged', desc: 'Fixed S3 public access policy', time: '1h ago', type: 'success' },
  { id: 3, title: 'Cost Anomaly', desc: 'RDS spend +40% in us-east-1', time: '3h ago', type: 'finops' },
  { id: 4, title: 'Policy Violation', desc: 'New user created without MFA', time: '5h ago', type: 'warning' },
];

export const Header: React.FC<HeaderProps> = ({ 
  isAuditor, onToggleAuditor, notificationsCount, onToggleLiveAssistant, 
  isLiveActive, activeProjectId, projects, onProjectChange, onOpenPalette,
  onToggleTerminal, isTerminalOpen, onMobileMenuClick, onLockSession
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  
  const activeProject = projects.find(p => p.id === activeProjectId);

  const getIcon = (type: string) => {
    switch(type) {
      case 'risk': return <AlertTriangle size={14} className="text-red-500" />;
      case 'success': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'finops': return <DollarSign size={14} className="text-amber-500" />;
      default: return <Shield size={14} className="text-blue-500" />;
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMobileMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <Menu size={20} />
        </button>

        <div className="relative hidden md:block">
          <button 
            onClick={() => setShowProjectSelector(!showProjectSelector)}
            className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-primary-500/40 transition-all group"
          >
            <div className={`p-1.5 rounded-lg ${activeProject?.cloud === 'AWS' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary-500/10 text-primary-500'}`}>
               <Cloud size={14} />
            </div>
            <div className="text-left">
               <div className="text-[10px] font-black text-white uppercase italic tracking-tighter leading-none">{activeProject?.name || 'Select Project'}</div>
               <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">{activeProject?.region || 'Global'}</div>
            </div>
            <ChevronDown size={14} className={`text-slate-600 transition-transform ${showProjectSelector ? 'rotate-180' : ''}`} />
          </button>

          {showProjectSelector && (
            <div className="absolute top-14 left-0 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[100] p-2 animate-in zoom-in-95">
               {projects.map(p => (
                 <button 
                   key={p.id}
                   onClick={() => { onProjectChange(p.id); setShowProjectSelector(false); }}
                   className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${p.id === activeProjectId ? 'bg-primary-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}
                 >
                   <Database size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{p.name}</span>
                 </button>
               ))}
            </div>
          )}
        </div>

        {/* Global Search / Command Trigger */}
        <button 
          onClick={onOpenPalette}
          className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 hover:text-white hover:border-slate-600 transition-all group w-48 md:w-64"
        >
           <Search size={14} />
           <span className="text-[10px] font-medium flex-1 text-left truncate">Search or run command...</span>
           <div className="hidden md:flex items-center gap-1 text-[9px] font-black bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 group-hover:text-white">
              <Command size={10} /> K
           </div>
        </button>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Terminal Toggle */}
        <button
          onClick={onToggleTerminal}
          className={`p-2 rounded-xl transition-all hidden md:block ${isTerminalOpen ? 'text-primary-500 bg-primary-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          title="Toggle System Terminal"
        >
          <Terminal size={18} />
        </button>

        <button 
          onClick={onToggleLiveAssistant}
          className={`group flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
            isLiveActive ? 'bg-primary-500 text-white border-primary-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Mic size={14} className={isLiveActive ? 'animate-pulse' : ''} />
          <span className="hidden md:inline">{isLiveActive ? 'Live Sync Active' : 'Live Advisor'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={onToggleAuditor}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase transition-all ${
              isAuditor ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
            }`}
          >
            {isAuditor ? <Shield size={12} /> : <User size={12} />}
            <span className="hidden md:inline">{isAuditor ? 'Auditor' : 'Admin'}</span>
          </button>

          {/* Session Lock Button */}
          <button
            onClick={onLockSession}
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
            title="Lock Console (Secure Session)"
          >
            <Lock size={14} />
          </button>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Bell size={20} />
            {notificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-[8px] font-black text-white flex items-center justify-center rounded-full border-2 border-slate-950">{notificationsCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-14 right-0 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-top-2">
               <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notifications</span>
                  <button onClick={() => setShowNotifications(false)}><X size={14} className="text-slate-500 hover:text-white"/></button>
               </div>
               <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {MOCK_NOTIFICATIONS.map(n => (
                    <div key={n.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                       <div className="flex gap-3">
                          <div className={`mt-1 p-1.5 rounded-lg h-fit ${n.type === 'risk' ? 'bg-red-500/10' : n.type === 'success' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                             {getIcon(n.type)}
                          </div>
                          <div>
                             <h4 className="text-xs font-bold text-white group-hover:text-primary-400 transition-colors">{n.title}</h4>
                             <p className="text-[10px] text-slate-500 leading-tight mt-1">{n.desc}</p>
                             <span className="text-[9px] text-slate-600 font-mono mt-2 block">{n.time}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-2 bg-slate-950/50 text-center">
                  <button className="text-[9px] font-black text-primary-500 uppercase tracking-widest hover:text-primary-400">Mark all as read</button>
               </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-800 hidden md:block"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg group-hover:scale-110 transition-transform">JD</div>
          <ChevronDown size={14} className="text-slate-500 hidden md:block" />
        </div>
      </div>
    </header>
  );
};
