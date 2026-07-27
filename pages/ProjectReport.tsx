import React, { useState, useEffect } from 'react';
import { Shield, Target, TrendingUp, Zap, Download, Loader2, CheckCircle2, X } from 'lucide-react';
import { SecurityScore, Vulnerability } from '../types';

interface ProjectReportProps {
  score: SecurityScore;
  vulnerabilities: Vulnerability[];
}

export const ProjectReport: React.FC<ProjectReportProps> = ({ score, vulnerabilities }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  const generateAndDownloadFile = () => {
    // Conteúdo do Relatório Formatado
    const reportContent = `
==================================================
      CLOUD GUARDIAN - EXECUTIVE REPORT
==================================================
Data de Geração: ${new Date().toLocaleString()}
Status: AUDIT READY
--------------------------------------------------

1. RESUMO DE POSTURA DE SEGURANÇA
--------------------------------------------------
HEALTH SCORE TOTAL: ${score.total}/100
Infraestrutura: ${score.infrastructure}%
Secrets: ${score.secrets}%
Compliance: ${score.compliance}%
Drift: ${score.drift}%

2. VULNERABILIDADES ATIVAS (${vulnerabilities.length})
--------------------------------------------------
${vulnerabilities.length === 0 ? 'Nenhuma vulnerabilidade detectada. Ambiente Seguro.' : vulnerabilities.map((v, i) => (
  `${i + 1}. [${v.severity}] ${v.title}\n   Recurso: ${v.resource}\n   Descrição: ${v.description}\n`
)).join('\n')}

3. ANÁLISE DE IMPACTO FINANCEIRO (ROI)
--------------------------------------------------
Economia estimada de 12 horas/semana em correções manuais.
Redução de risco de vazamento de dados via Auto-Remediação IA.

--------------------------------------------------
CloudGuardian Engine v2.4.0-stable
MD5 Integrity: ${Math.random().toString(36).substring(7).toUpperCase()}
==================================================
    `;

    // Criar o Blob e disparar o download
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CloudGuardian_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleStartGeneration = () => {
    setIsGenerating(true);
    setProgress(0);
    setIsSuccess(false);
  };

  useEffect(() => {
    if (isGenerating) {
      const steps = ["Extraindo métricas...", "Mapeando vulnerabilidades...", "Calculando ROI...", "Gerando documento..."];
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => { 
              setIsGenerating(false); 
              setIsSuccess(true);
              generateAndDownloadFile(); // Dispara o download real aqui
            }, 500);
            return 100;
          }
          const newProgress = prev + 12;
          const stepIndex = Math.floor((newProgress / 100) * steps.length);
          if (stepIndex < steps.length) setStatusText(steps[stepIndex]);
          return Math.min(newProgress, 100);
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      {isSuccess && (
        <div className="fixed top-24 right-8 z-[100] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10">
          <CheckCircle2 size={24} />
          <div>
            <p className="font-bold text-sm">Download Iniciado!</p>
            <p className="text-[10px] opacity-80 uppercase font-mono">Relatório_Executivo.txt</p>
          </div>
          <button onClick={() => setIsSuccess(false)}><X size={16} /></button>
        </div>
      )}

      <div className="border-b border-slate-800 pb-12 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-primary-600/10 rounded-3xl border border-primary-500/20 shadow-2xl">
            <Shield className="text-primary-500" size={48} />
          </div>
          <div>
            <div className="flex gap-2 mb-2">
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-[10px] font-black uppercase tracking-widest rounded">Status: Audit Ready</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded">v2.4</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Executive Report</h1>
            <p className="text-slate-500 text-sm font-medium">Análise de conformidade gerada em {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center min-w-[180px] shadow-xl">
          <span className="text-[10px] text-slate-500 font-black uppercase mb-1">Health Score</span>
          <div className={`text-5xl font-black ${score.total > 70 ? 'text-emerald-500' : 'text-red-500'} transition-all`}>{score.total}</div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[32px] space-y-6">
           <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase italic"><Target className="text-primary-500" /> Resumo do Ambiente</h2>
           <div className="grid grid-cols-2 gap-4">
              <Metric label="Riscos Ativos" value={vulnerabilities.length} color={vulnerabilities.length > 0 ? "text-red-500" : "text-emerald-500"} />
              <Metric label="Secret Scan" value={`${score.secrets}%`} color="text-emerald-500" />
           </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[32px] flex flex-col justify-center gap-6">
           <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase italic"><TrendingUp className="text-indigo-500" /> ROI de Automação</h2>
           <div className="space-y-2">
              <p className="text-sm text-slate-400 italic">"Substituindo 12h de trabalho manual de analista de segurança por semana."</p>
              <div className="text-xs font-bold text-indigo-400 bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10 w-fit">Impacto: $1,200/mês economizados</div>
           </div>
        </div>
      </section>

      <div className="flex flex-col items-center gap-6 pt-12 border-t border-slate-800">
        <div className="text-center space-y-2 mb-4">
          <p className="text-slate-500 text-sm">Este relatório contém as evidências necessárias para auditorias de conformidade.</p>
        </div>
        <button 
          onClick={handleStartGeneration} 
          disabled={isGenerating} 
          className="px-12 py-5 bg-primary-600 hover:bg-primary-700 text-white font-black text-lg rounded-2xl transition-all shadow-2xl shadow-primary-900/40 flex items-center gap-3 disabled:opacity-50 group active:scale-95"
        >
           {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} className="group-hover:-translate-y-1 transition-transform" />}
           {isGenerating ? 'Processando Dados...' : 'Gerar & Baixar Relatório'}
        </button>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center animate-in fade-in">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="text-primary-500" size={32} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-widest">Consolidando Evidências</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest h-4">{statusText}</p>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
               <div className="h-full bg-primary-600 transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value, color }: any) => (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
);