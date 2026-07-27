
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ArrowRight, Command, LayoutDashboard, ShieldAlert, 
  Network, FileCheck, Activity, Terminal, DollarSign, 
  Users, Radar, Hammer, BookOpen, Box, Radio, Zap, Lock,
  Shield, Play, LogOut, FileText, Rocket, TrendingUp
} from 'lucide-react';
import { View } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  actions: {
    toggleAuditor: () => void;
    toggleLive: () => void;
    logout: () => void;
  };
}

type CommandItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  type: 'navigation' | 'action';
  action?: () => void;
  view?: View;
  desc?: string;
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, actions }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dash', label: 'Go to Dashboard', icon: LayoutDashboard, type: 'navigation', view: 'dashboard', desc: 'Visão geral e métricas' },
    { id: 'nav-forge', label: 'Go to Security Forge', icon: ShieldAlert, type: 'navigation', view: 'scanner', desc: 'Scanner IaC e Remediação' },
    { id: 'nav-sentinel', label: 'Go to Sentinel Radar', icon: Radio, type: 'navigation', view: 'sentinel', desc: 'Inteligência de Ameaças Global' },
    { id: 'nav-warroom', label: 'Go to War Room', icon: Radar, type: 'navigation', view: 'war-room', desc: 'Resposta a Incidentes' },
    { id: 'nav-inv', label: 'Go to Asset Inventory', icon: Box, type: 'navigation', view: 'inventory', desc: 'Lista de ativos Multi-cloud' },
    { id: 'nav-policies', label: 'Go to Policy Forge', icon: Hammer, type: 'navigation', view: 'policy-forge', desc: 'Editor de Guardrails' },
    { id: 'nav-graph', label: 'Go to Topology Graph', icon: Network, type: 'navigation', view: 'graph', desc: 'Visualização de Infraestrutura' },
    { id: 'nav-cicd', label: 'Go to CI/CD Pipelines', icon: Terminal, type: 'navigation', view: 'cicd', desc: 'Integração GitHub Actions' },
    { id: 'nav-finops', label: 'Go to FinOps Advisor', icon: DollarSign, type: 'navigation', view: 'finops', desc: 'Otimização de Custos' },
    { id: 'nav-kb', label: 'Open Knowledge Base', icon: BookOpen, type: 'navigation', view: 'knowledge-base', desc: 'Manual do Usuário' },
    { id: 'nav-roadmap', label: 'Go to Tech Roadmap', icon: Rocket, type: 'navigation', view: 'roadmap', desc: 'Plano de Desenvolvimento e Fases' },
    { id: 'nav-sales', label: 'Go to Sales & Monetization', icon: TrendingUp, type: 'navigation', view: 'sales-playbook', desc: 'Regras de Negócio, Preços e Monetização' },
    
    // Actions
    { id: 'act-auditor', label: 'Toggle Auditor Mode', icon: Lock, type: 'action', action: actions.toggleAuditor, shortcut: 'A', desc: 'Alternar modo somente leitura' },
    { id: 'act-live', label: 'Start Live Advisor', icon: Zap, type: 'action', action: actions.toggleLive, desc: 'Assistente de voz em tempo real' },
    { id: 'act-report', label: 'Generate Executive Report', icon: FileText, type: 'navigation', view: 'report', desc: 'Exportar PDF de Compliance' },
    { id: 'act-logout', label: 'Log Out', icon: LogOut, type: 'action', action: actions.logout, desc: 'Sair da sessão' },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) || 
    cmd.desc?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  const executeCommand = (cmd: CommandItem) => {
    if (!cmd) return;
    if (cmd.type === 'navigation' && cmd.view) {
      onNavigate(cmd.view);
    } else if (cmd.type === 'action' && cmd.action) {
      cmd.action();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-slate-800 bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-500 mr-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 text-sm font-medium focus:outline-none"
          />
          <div className="flex items-center gap-2">
             <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400">
               ESC
             </kbd>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No results found.</div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;
              
              return (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-100 ${
                    isSelected ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex flex-col items-start truncate">
                      <span className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {cmd.label}
                      </span>
                      {cmd.desc && (
                        <span className={`text-[10px] truncate ${isSelected ? 'text-primary-200' : 'text-slate-500'}`}>
                          {cmd.desc}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isSelected && <ArrowRight size={16} className="animate-in slide-in-from-left-2 fade-in" />}
                  {!isSelected && cmd.shortcut && (
                    <span className="text-[9px] font-bold text-slate-600 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                      {cmd.shortcut}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
        
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[9px] font-bold text-slate-600 uppercase tracking-widest">
           <span>CloudGuardian Neural Interface</span>
           <div className="flex gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
           </div>
        </div>
      </div>
    </div>
  );
};
