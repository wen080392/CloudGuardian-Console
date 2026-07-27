
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Github, GitBranch, ShieldCheck, CheckCircle2, XCircle, Clock, Play, ArrowUpRight, GitCommit, Loader2, ChevronRight, Copy, Check, FileCode, Zap, AlertTriangle, ShieldAlert, GitMerge, Lock, Shield, Layers } from 'lucide-react';
import { PipelineRun, Severity } from '../types';

interface PipelineInsightsProps {
  runs: PipelineRun[];
  setRuns: React.Dispatch<React.SetStateAction<PipelineRun[]>>;
  onNotify: (msg: string) => void;
  onTimeline: (event: any) => void;
}

export const PipelineInsights: React.FC<PipelineInsightsProps> = ({ runs, setRuns, onNotify, onTimeline }) => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [currentStage, setCurrentStage] = useState(0); // 0: Idle, 1: Checkout, 2: Scan, 3: Validation, 4: Complete
  const [activeTab, setActiveTab] = useState<'history' | 'workflow' | 'pr-simulator'>('history');
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  
  // PR Simulator State
  const [prState, setPrState] = useState<'idle' | 'detected' | 'fixing' | 'resolved' | 'ignored'>('detected');
  
  // Config State
  const [config, setConfig] = useState({
    failOnCritical: true,
    autoFix: true,
    enforceTags: false,
    deepSecretScan: true,
    prComments: true
  });

  const logEndRef = useRef<HTMLDivElement>(null);

  const workflowYaml = `name: CloudGuardian Security Scan

on:
  pull_request:
    branches: [ main, develop ]
    paths:
      - '**.tf'
      - '**.tfvars'

jobs:
  security_scan:
    name: CloudGuardian IaC Analysis
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Run CloudGuardian Engine
        uses: cloudguardian/scanner-action@v1
        with:
          api_key: \${{ secrets.CG_API_KEY }}
          fail_on_critical: true
          output_format: github-pr-comment
          
      - name: AI Auto-Remediation Suggestion
        if: failure()
        run: echo "CloudGuardian detectou vulnerabilidades. Verifique os comentários no PR."`;

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(workflowYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onNotify("Workflow copiado para o clipboard!");
  };

  const triggerManualScan = () => {
    setIsTriggering(true);
    setCurrentStage(1);
    setLogs([]);
    
    // Stage 1: Checkout
    addLog("Initializing CloudGuardian CI/CD Runner v2.4...");
    addLog("Fetching Terraform HCL context...");
    
    setTimeout(() => {
      setCurrentStage(2);
      addLog("Running SAST analysis with Gemini Engine...");
      
      setTimeout(() => {
        setCurrentStage(3);
        addLog("Policy validation: SOC2 CC6.6 - PASS");
        addLog("Policy validation: ISO27001 A.10 - PASS");
        
        setTimeout(() => {
          setCurrentStage(4);
          addLog("Finalizing results and reporting to central dashboard...");
          
          setTimeout(() => {
            const newRun: PipelineRun = {
              id: `run-${Math.floor(Math.random() * 1000)}`,
              branch: 'main',
              status: 'success',
              vulns: 0,
              timestamp: new Date().toISOString(),
              commit: 'manual: security baseline scan'
            };
            
            setRuns(prev => [newRun, ...prev]);
            setIsTriggering(false);
            setCurrentStage(0);
            onNotify("Pipeline executado com sucesso!");
            onTimeline({
              type: 'PIPELINE',
              title: 'Pipeline Ad-Hoc Concluído',
              description: 'Scan manual de infraestrutura validado. Status: Clean.',
              severity: Severity.LOW
            });
          }, 800);
        }, 1200);
      }, 1500);
    }, 1500);
  };

  const initPRSimulation = () => {
    setActiveTab('pr-simulator');
    setPrState('detected');
    onNotify("Simulação de PR Guard iniciada. Violação detectada.");
    
    // Add failed run to history
    const failedRun: PipelineRun = {
        id: `run-${Math.floor(Math.random() * 1000)}`,
        branch: 'feat/new-s3-bucket',
        status: 'failed',
        vulns: 1,
        timestamp: new Date().toISOString(),
        commit: 'feat: add public bucket',
        prNumber: Math.floor(Math.random() * 100) + 50
    };
    setRuns(prev => [failedRun, ...prev]);
  };

  const handleApplyAutoPR = () => {
    setPrState('fixing');
    setTimeout(() => {
        setPrState('resolved');
        onNotify("Correção aplicada e PR mergeado com sucesso!");
        
        const successRun: PipelineRun = {
            id: `run-${Math.floor(Math.random() * 1000)}`,
            branch: 'feat/new-s3-bucket',
            status: 'success',
            vulns: 0,
            timestamp: new Date().toISOString(),
            commit: 'fix(security): restrict s3 access',
            prNumber: Math.floor(Math.random() * 100) + 50
        };
        setRuns(prev => [successRun, ...prev]);

        onTimeline({
            type: 'PR',
            title: 'Auto-Remediação CI/CD',
            description: 'CloudGuardian Bot corrigiu e mergeou o PR #82 automaticamente.',
            severity: Severity.LOW
        });
    }, 2500);
  };

  const handleIgnorePR = () => {
      setPrState('ignored');
      onNotify("Risco aceito. PR liberado manualmente.");
      onTimeline({
        type: 'PR',
        title: 'Risco Aceito (Bypass)',
        description: 'Usuário forçou o merge do PR #82 ignorando alertas de segurança.',
        severity: Severity.MEDIUM
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-200">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Pipeline Insights</h2>
          <p className="text-slate-400 text-sm">Integração nativa de segurança no fluxo de CI/CD (Shift-Left).</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={triggerManualScan}
            disabled={isTriggering}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-slate-700 transition-all shadow-xl disabled:opacity-50 active:scale-95"
          >
            {isTriggering ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
            {isTriggering ? 'Executing...' : 'Manual Scan'}
          </button>
          <button 
            onClick={initPRSimulation}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/30 active:scale-95"
          >
            <Zap size={16} />
            Simular PR Guard
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl w-fit border border-slate-800">
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Run History" icon={<Clock size={14}/>} />
        <TabButton active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} label="Setup Workflow" icon={<FileCode size={14}/>} />
        <TabButton active={activeTab === 'pr-simulator'} onClick={() => setActiveTab('pr-simulator')} label="PR Guard Simulator" icon={<Github size={14}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'history' && (
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Github size={120} />
               </div>
               
               {isTriggering ? (
                 <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-center px-4">
                       <StageNode label="Checkout" status={currentStage >= 1 ? (currentStage > 1 ? 'done' : 'active') : 'pending'} />
                       <div className={`h-0.5 flex-1 mx-2 transition-all duration-500 ${currentStage > 1 ? 'bg-primary-500' : 'bg-slate-800'}`}></div>
                       <StageNode label="Scan Analysis" status={currentStage >= 2 ? (currentStage > 2 ? 'done' : 'active') : 'pending'} />
                       <div className={`h-0.5 flex-1 mx-2 transition-all duration-500 ${currentStage > 2 ? 'bg-primary-500' : 'bg-slate-800'}`}></div>
                       <StageNode label="Policy Check" status={currentStage >= 3 ? (currentStage > 3 ? 'done' : 'active') : 'pending'} />
                       <div className={`h-0.5 flex-1 mx-2 transition-all duration-500 ${currentStage > 3 ? 'bg-primary-500' : 'bg-slate-800'}`}></div>
                       <StageNode label="Report" status={currentStage >= 4 ? 'done' : 'pending'} />
                    </div>
                    
                    <div className="bg-black/80 rounded-2xl p-6 border border-slate-800 font-mono text-[10px] text-emerald-500 min-h-[200px] max-h-[200px] overflow-y-auto space-y-1 custom-scrollbar animate-in zoom-in-95 shadow-inner">
                        {logs.map((log, i) => (
                          <div key={i} className="flex gap-3">
                            <ChevronRight size={10} className="mt-0.5 opacity-50" />
                            <span>{log}</span>
                          </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                 </div>
               ) : (
                 <div className="space-y-4 relative z-10 flex-1">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Histórico de Pipeline</h4>
                    <div className="space-y-3">
                      {runs.length === 0 ? (
                          <div className="text-center py-10 opacity-50">
                              <span className="text-xs font-black text-slate-500 uppercase">Sem execuções recentes</span>
                          </div>
                      ) : (
                          runs.map(run => (
                          <PipelineRunRow key={run.id} {...run} />
                          ))
                      )}
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-6 shadow-2xl animate-in fade-in duration-300 min-h-[500px]">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 italic uppercase tracking-tight">
                      <FileCode className="text-primary-500" /> GitHub Actions Setup
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black mt-1">Implemente o CloudGuardian em seu pipeline em segundos.</p>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase rounded-xl transition-all"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copiado' : 'Copiar YAML'}
                  </button>
               </div>
               
               <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-[11px] text-slate-400 overflow-x-auto custom-scrollbar shadow-inner leading-relaxed">
                  <pre>{workflowYaml}</pre>
               </div>
               
               <div className="p-4 bg-primary-500/5 border border-primary-500/20 rounded-2xl flex items-start gap-4">
                  <Zap className="text-primary-500 mt-1" size={20} />
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-tight">Como instalar:</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      1. Crie o arquivo <code className="text-primary-400">.github/workflows/cloudguardian.yml</code><br/>
                      2. Cole o código acima.<br/>
                      3. Adicione sua chave de API nos Secrets do repositório como <code className="text-primary-400">CG_API_KEY</code>.
                    </p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'pr-simulator' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
               <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-6 shadow-2xl relative">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-primary-500">
                        <Github size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Pull Request Guard</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Simulação de Interceptação de PR Inseguro</p>
                      </div>
                    </div>
                  </div>

                  {/* Simulator States */}
                  {prState === 'idle' && (
                      <div className="bg-slate-950/30 border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center">
                          <GitBranch className="mx-auto text-slate-700 mb-4" size={48} />
                          <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Aguardando Evento de PR</h4>
                          <button onClick={initPRSimulation} className="mt-4 text-primary-500 text-xs font-bold underline">Iniciar Simulação Manualmente</button>
                      </div>
                  )}

                  {(prState === 'detected' || prState === 'fixing') && (
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl border-l-4 border-l-red-500 animate-in zoom-in-95">
                        <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-lg">
                                <Shield size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white">cloudguardian-bot <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded ml-2">BOT</span></div>
                                <div className="text-[9px] text-slate-600 font-bold uppercase">Analisou este commit • Agora mesmo</div>
                            </div>
                            </div>
                            <AlertTriangle className="text-red-500" size={18} />
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tight">⚠️ Security Policy Violation</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Detectado recurso <code className="text-primary-400">aws_s3_bucket.data</code> com <code className="text-red-400">acl = "public-read"</code>.
                                Esta configuração viola a política <span className="text-slate-300 font-bold">SOC2_CC6.6</span> (Network Perimeter Security).
                            </p>
                            </div>
                            
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-primary-400 uppercase tracking-widest">
                                <Zap size={12} /> Auto-Remediation Proposal
                            </div>
                            <div className="font-mono text-[10px] space-y-1">
                                <div className="text-red-500/70">-  acl = "public-read"</div>
                                <div className="text-emerald-500">+  acl = "private"</div>
                                <div className="text-emerald-500">+  block_public_access = true</div>
                            </div>
                            </div>

                            {prState === 'detected' ? (
                                <div className="flex gap-3">
                                    <button onClick={handleApplyAutoPR} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-primary-900/20 active:scale-95 flex items-center justify-center gap-2">
                                        <Zap size={14} /> Aplicar via Auto-PR
                                    </button>
                                    <button onClick={handleIgnorePR} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-black uppercase rounded-xl transition-all border border-slate-700">
                                        Ignorar (Falso Positivo)
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full py-4 bg-slate-800 rounded-xl flex items-center justify-center gap-3 text-white text-xs font-bold border border-slate-700">
                                    <Loader2 className="animate-spin text-primary-500" size={18} />
                                    Aplicando correção e commitando...
                                </div>
                            )}
                        </div>
                    </div>
                  )}

                  {prState === 'resolved' && (
                      <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in">
                          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                              <GitMerge size={32} className="text-white" />
                          </div>
                          <div>
                              <h3 className="text-xl font-black text-white uppercase italic">PR Merged & Secure</h3>
                              <p className="text-xs text-emerald-400 font-medium mt-1">Todas as verificações passaram. Branch removido.</p>
                          </div>
                          <button onClick={() => setPrState('idle')} className="px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase rounded-xl transition-all">
                              Reset Simulator
                          </button>
                      </div>
                  )}

                  {prState === 'ignored' && (
                      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in opacity-70">
                          <Lock size={32} className="text-slate-500" />
                          <div>
                              <h3 className="text-lg font-black text-slate-400 uppercase italic">Risk Accepted</h3>
                              <p className="text-xs text-slate-500 font-medium mt-1">O PR foi liberado manualmente. O incidente foi registrado no log de auditoria.</p>
                          </div>
                          <button onClick={() => setPrState('idle')} className="px-6 py-2 bg-slate-800 text-slate-400 text-[10px] font-black uppercase rounded-xl transition-all">
                              Reset Simulator
                          </button>
                      </div>
                  )}

               </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 space-y-6 shadow-xl">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <Terminal size={14} className="text-primary-500" />
                 Scan Configuration
              </h4>
              <div className="space-y-4">
                 <ConfigToggle 
                    label="Fail Pipeline on Critical" 
                    active={config.failOnCritical} 
                    onToggle={() => setConfig({...config, failOnCritical: !config.failOnCritical})} 
                 />
                 <ConfigToggle 
                    label="Auto-Fix common issues" 
                    active={config.autoFix} 
                    onToggle={() => setConfig({...config, autoFix: !config.autoFix})} 
                 />
                 <ConfigToggle 
                    label="Enforce Policy Tags" 
                    active={config.enforceTags} 
                    onToggle={() => setConfig({...config, enforceTags: !config.enforceTags})} 
                 />
                 <ConfigToggle 
                    label="Secret Scanning (Deep)" 
                    active={config.deepSecretScan} 
                    onToggle={() => setConfig({...config, deepSecretScan: !config.deepSecretScan})} 
                 />
                 <ConfigToggle 
                    label="GitHub PR Comments" 
                    active={config.prComments} 
                    onToggle={() => setConfig({...config, prComments: !config.prComments})} 
                 />
              </div>
           </div>

           <div className="bg-slate-950 border border-slate-800 rounded-[32px] p-8 text-center space-y-4 border-t-primary-500 border-t-2 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary-500/5 group-hover:bg-primary-500/10 transition-colors"></div>
              <div className="relative z-10">
                <div className="text-4xl font-black text-white">100%</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Infrastructure Health</div>
                <p className="text-[10px] text-slate-600 italic leading-relaxed mt-4">
                   O motor CloudGuardian garante que nenhuma alteração insegura seja aplicada em produção via PR Guard.
                </p>
                <button className="mt-6 w-full py-3 bg-slate-900 border border-slate-800 rounded-xl text-[9px] font-black text-primary-400 uppercase tracking-widest hover:border-primary-500/30 transition-all">
                  Ver Métricas de Pipeline
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StageNode = ({ label, status }: { label: string, status: 'pending' | 'active' | 'done' }) => (
  <div className="flex flex-col items-center gap-2">
     <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
        status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' :
        status === 'active' ? 'bg-primary-600 border-primary-500 text-white animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
        'bg-slate-900 border-slate-700 text-slate-500'
     }`}>
        {status === 'done' ? <Check size={14} /> : (status === 'active' ? <Loader2 size={14} className="animate-spin" /> : <div className="w-2 h-2 bg-slate-700 rounded-full"/>)}
     </div>
     <span className={`text-[9px] font-black uppercase tracking-tight ${status === 'active' ? 'text-primary-400' : 'text-slate-500'}`}>{label}</span>
  </div>
);

const PipelineRunRow = ({ id, branch, status, vulns, timestamp, commit, prNumber }: PipelineRun) => (
  <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all group animate-in slide-in-from-top-2">
    <div className="flex items-center gap-4">
      <div className={`w-1 h-10 rounded-full ${status === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
           <span className="text-[10px] font-mono text-slate-500 uppercase">RUN: {id}</span>
           <div className="flex items-center gap-1 text-[10px] text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded">
              <GitBranch size={10} /> {branch}
           </div>
           {prNumber && (
             <div className="flex items-center gap-1 text-[10px] text-primary-400 font-bold bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20">
                PR #{prNumber}
             </div>
           )}
        </div>
        <div className="text-xs font-bold text-white truncate max-w-[200px] flex items-center gap-2 italic">
           <GitCommit size={12} className="text-slate-600" />
           {commit}
        </div>
      </div>
    </div>
    <div className="text-right flex items-center gap-6">
       <div className="hidden md:block">
          <div className={`text-xs font-black ${vulns > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {vulns === 0 ? 'CLEAN' : `${vulns} RISKS`}
          </div>
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Status</div>
       </div>
       <div className="flex items-center gap-3">
          <div className="text-right">
             <div className="text-[10px] font-bold text-slate-300">
               {new Date(timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
             </div>
             {status === 'success' ? <CheckCircle2 size={16} className="text-emerald-500 ml-auto" /> : <XCircle size={16} className="text-red-500 ml-auto" />}
          </div>
          <ArrowUpRight size={14} className="text-slate-700 group-hover:text-primary-400 transition-colors" />
       </div>
    </div>
  </div>
);

const ConfigToggle = ({ label, active, onToggle }: any) => (
  <div className="flex items-center justify-between group cursor-pointer" onClick={onToggle}>
    <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors">{label}</span>
    <div className={`w-8 h-4 rounded-full relative transition-all border ${active ? 'bg-primary-600 border-primary-500' : 'bg-slate-800 border-slate-700'}`}>
      <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all bg-white ${active ? 'right-0.5' : 'left-0.5'}`}></div>
    </div>
  </div>
);

const TabButton = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {icon}
    {label}
  </button>
);
