
import React, { useState } from 'react';
import { Clock, Shield, AlertTriangle, GitPullRequest, Activity, CheckCircle, Download, History, Loader2, CheckCircle2, X } from 'lucide-react';
import { TimelineEvent, Severity } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    // Simulação de geração de hash de integridade
    const logData = events.map(e => `[${new Date(e.timestamp).toLocaleString()}] ${e.type}: ${e.title} - ${e.description}`).join('\n');
    const header = `CLOUDGUARDIAN AUDIT LOG\nVERSION: 2.4\nINTEGRITY_HASH: ${Math.random().toString(36).substring(7).toUpperCase()}\n------------------------------------\n`;
    
    const blob = new Blob([header + logData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CloudGuardian_Audit_Log_${Date.now()}.txt`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setIsExporting(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500 text-slate-200">
      {showToast && (
        <div className="fixed top-24 right-8 z-[100] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10">
          <CheckCircle2 size={24} />
          <div>
            <p className="font-bold text-sm">Auditoria Exportada</p>
            <p className="text-[10px] opacity-80 uppercase font-mono">Manifesto gerado com sucesso.</p>
          </div>
          <button onClick={() => setShowToast(false)}><X size={16} /></button>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Security Timeline</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Audit log certificado de todas as operações de segurança.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting || events.length === 0}
          className="flex items-center gap-3 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/30 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          {isExporting ? 'Processando...' : 'Baixar Audit Trail'}
        </button>
      </header>

      <div className="relative">
        <div className="absolute left-[23.5px] top-0 bottom-0 w-1 bg-gradient-to-b from-slate-800 via-slate-800/50 to-transparent"></div>
        
        <div className="space-y-12 relative">
          {events.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-24 text-center">
               <History className="mx-auto text-slate-800 mb-4 opacity-30" size={64} />
               <h3 className="text-xl font-bold text-slate-600 uppercase tracking-widest">Nenhum evento registrado</h3>
               <p className="text-sm text-slate-700 mt-2 italic">Ações do scanner e remediações aparecerão aqui.</p>
            </div>
          ) : (
            events.map((event, index) => (
              <div key={event.id} className="flex gap-10 group animate-in slide-in-from-left-4" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="relative z-10 shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xl transition-all group-hover:scale-110 ${getIconStyles(event)}`}>
                    {getIcon(event.type)}
                  </div>
                </div>
                <div className="flex-1 space-y-3 pt-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-white tracking-tight">{event.title}</h3>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${getBadgeStyles(event)}`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="text-slate-600 font-mono text-[10px]">{new Date(event.timestamp).toLocaleTimeString()}</div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-slate-700 transition-colors">
                    <p className="text-sm text-slate-400 font-medium leading-relaxed italic border-l-2 border-slate-800 pl-4">{event.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const getIcon = (type: string) => {
    switch (type) {
        case 'RISK': return <AlertTriangle size={20} />;
        case 'PR': return <GitPullRequest size={20} />;
        case 'COMPLIANCE': return <CheckCircle size={20} />;
        case 'DRIFT': return <Activity size={20} />;
        case 'SCAN': return <Shield size={20} />;
        default: return <Shield size={20} />;
    }
};

const getIconStyles = (event: TimelineEvent) => {
    if (event.severity === Severity.CRITICAL || event.type === 'RISK') return 'bg-red-500/10 border-red-500/30 text-red-500';
    if (event.type === 'PR') return 'bg-primary-500/10 border-primary-500/30 text-primary-500';
    return 'bg-slate-800 border-slate-700 text-slate-400';
};

const getBadgeStyles = (event: TimelineEvent) => {
    if (event.type === 'RISK') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (event.type === 'PR') return 'bg-primary-500/10 text-primary-500 border-primary-500/20';
    return 'bg-slate-800 text-slate-400 border border-slate-700';
};
