
import React from 'react';
import { View } from '../types';
import { 
  LayoutDashboard, ShieldAlert, Network, FileCheck, Settings, 
  Shield, Activity, LogOut, Rocket, Clock, 
  Terminal, Gavel, DollarSign, Users, Radar, Hammer, Box, Radio,
  BookOpen, FlaskConical, Lock, ShieldCheck, Check, Zap, Wand2, Workflow,
  TrendingUp, FileText
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  isAuditorMode?: boolean;
  hasActiveIncident?: boolean;
  isMobileOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, isAuditorMode = false, hasActiveIncident = false, isMobileOpen = false }) => {
  const menuItems: { id: View; label: string; icon: React.ElementType; hiddenForAuditor?: boolean; adminOnly?: boolean; special?: boolean }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'architect', label: 'AI Architect', icon: Wand2 },
    { id: 'scanner', label: 'Security Forge', icon: ShieldAlert, hiddenForAuditor: true },
    { id: 'sentinel', label: 'Sentinel Radar', icon: Radio },
    { id: 'war-room', label: 'War Room', icon: Radar, special: true },
    { id: 'inventory', label: 'Asset Inventory', icon: Box },
    { id: 'graph', label: 'Infra Graph', icon: Network },
    { id: 'automation', label: 'Workflows (SOAR)', icon: Workflow, hiddenForAuditor: true },
    { id: 'policy-forge', label: 'Policy Forge', icon: Hammer },
    { id: 'security-tests', label: 'Testing Lab', icon: FlaskConical },
    { id: 'drift', label: 'Drift Monitor', icon: Activity },
    { id: 'finops', label: 'FinOps Advisor', icon: DollarSign },
    { id: 'organization', label: 'Organization', icon: Users, adminOnly: true },
    { id: 'timeline', label: 'Audit Trail', icon: Clock },
    { id: 'cicd', label: 'Ops Pipelines', icon: Terminal },
    { id: 'policies', label: 'Governance', icon: Gavel, adminOnly: true },
    { id: 'compliance', label: 'Compliance', icon: FileCheck },
    { id: 'roadmap', label: 'Tech Roadmap', icon: Rocket },
    { id: 'sales-playbook', label: 'Sales & Monetization', icon: TrendingUp },
    { id: 'report', label: 'Executive Report', icon: FileText },
    { id: 'knowledge-base', label: 'Manual & Help', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings, hiddenForAuditor: true },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.id === 'war-room' && !hasActiveIncident && currentView !== 'war-room') return false;
    if (isAuditorMode && item.hiddenForAuditor) return false;
    if (isAuditorMode && item.adminOnly) return false;
    return true;
  });

  return (
    <div className={`
      fixed top-0 left-0 h-[calc(100vh-2rem)] m-4 flex flex-col 
      bg-slate-900/95 backdrop-blur-xl border border-white/5 rounded-[32px] shadow-2xl z-[150]
      transition-transform duration-300 ease-in-out
      w-64
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}
    `}>
      <div className="p-8 flex items-center gap-3">
        <div className="p-2 bg-primary-600 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)]">
          <Shield className="text-white" size={20} />
        </div>
        <h1 className="text-lg font-black text-white tracking-tighter uppercase italic">CloudGuardian</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isWarRoom = item.id === 'war-room';
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between group px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive
                  ? (isWarRoom ? 'bg-red-600/20 text-red-500 border border-red-500/30' : 'bg-white/5 text-white border border-white/10 shadow-lg')
                  : (isWarRoom ? 'text-red-600 hover:bg-red-600/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]')
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? (isWarRoom ? 'text-red-500' : 'text-primary-400') : (isWarRoom ? 'text-red-600 animate-pulse' : 'text-slate-600 group-hover:text-slate-400')} />
                <span className={`font-bold text-[11px] uppercase tracking-widest ${isWarRoom ? 'text-red-500' : ''}`}>{item.label}</span>
              </div>
              {isActive && <div className={`w-1.5 h-1.5 rounded-full ${isWarRoom ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-primary-500 shadow-[0_0_8px_#3b82f6]'}`}></div>}
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/5 space-y-4 bg-black/20 rounded-b-[32px]">
         {/* Security Health Widget */}
         <div className="space-y-3">
            <div className="flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
               <span>Security Posture</span>
               <span className="text-emerald-500 animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Audit Ready</span>
            </div>
            <div className="p-3 bg-slate-950 border border-white/5 rounded-2xl space-y-2 relative overflow-hidden group">
               {/* Scan line animation */}
               <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/50 shadow-[0_0_10px_#10b981] animate-[scan_3s_linear_infinite] opacity-50"></div>
               
               <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                     <Lock size={10} className="text-emerald-500" /> TLS 1.3 Encrypted
                  </div>
                  <Check size={10} className="text-emerald-500" />
               </div>
               <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                     <ShieldCheck size={10} className="text-emerald-500" /> Zero-Data Retention
                  </div>
                  <Check size={10} className="text-emerald-500" />
               </div>
               <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                     <Zap size={10} className="text-emerald-500" /> Active Defense
                  </div>
                  <Check size={10} className="text-emerald-500" />
               </div>
            </div>
         </div>

        <div className="flex items-center gap-3 px-1 pt-2 border-t border-white/5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 flex items-center justify-center text-[10px] font-black shadow-lg">
              {isAuditorMode ? 'AU' : 'JD'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-white truncate uppercase tracking-tight">
              {isAuditorMode ? 'Auditor' : 'John Doe'}
            </span>
            <button onClick={onLogout} className="text-[9px] text-slate-500 font-bold uppercase truncate tracking-widest hover:text-red-400 text-left transition-colors">
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
