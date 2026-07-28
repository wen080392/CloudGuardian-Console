import PricingPage from './pages/PricingPage';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AIAssistant } from './components/AIAssistant';
import { LiveAssistant } from './components/LiveAssistant';
import { CommandPalette } from './components/CommandPalette';
import { SystemTerminal } from './components/SystemTerminal';
import { Dashboard } from './pages/Dashboard';
import { Scanner } from './pages/Scanner';
import { Graph } from './pages/Graph';
import { Compliance } from './pages/Compliance';
import { Settings } from './pages/Settings';
import { Drift } from './pages/Drift';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { AutomationHub } from './pages/AutomationHub';
import { ReportsPage } from './pages/ReportsPage';
import { Timeline } from './pages/Timeline';
import { SalesPlaybook } from './pages/SalesPlaybook';
import { PolicyManager } from './pages/PolicyManager';
import { PipelineInsights } from './pages/PipelineInsights';
import { FinOps } from './pages/FinOps';
import { Roadmap } from './pages/Roadmap';
import { Organization } from './pages/Organization';
import { SecurityTesting } from './pages/SecurityTesting';
import { WarRoom } from './pages/WarRoom';
import { PostMortem } from './pages/PostMortem';
import { PolicyForge } from './pages/PolicyForge';
import { Inventory } from './pages/Inventory';
import { SentinelMap } from './pages/SentinelMap';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Architect } from './pages/Architect';
import { AuditorBanner } from './components/AuditorBanner';
import { View, Vulnerability, DriftItem, TimelineEvent, Severity, Policy, PipelineRun, ScanStatus, Project } from './types';
import { API } from './services/backend';
import { dbService } from './services/dbService';
import { useAuth } from './hooks/useAuth';
import { Loader2, CheckCircle2, X, Lock, Fingerprint } from 'lucide-react';

const DEFAULT_CODE = `resource "aws_s3_bucket" "prod_assets" {
  bucket = "cloudguardian-customer-data"
  acl    = "public-read"
}

resource "aws_security_group" "ssh_access" {
  name        = "ssh_open"
  description = "Permit SSH from anywhere"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
`;

function App() {
  const { isAuthenticated, logout, login } = useAuth();
  const queryClient = useQueryClient();
  const [showLogin, setShowLogin] = useState(false);
  const [showPricing, setShowPricing] = useState(window.location.pathname === "/pricing");
  const [isSuccess, setIsSuccess] = useState(window.location.pathname === "/success");
  const [isAuditorMode, setIsAuditorMode] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(localStorage.getItem('cg_active_project'));
  
  const [terraformCode, setTerraformCode] = useState(DEFAULT_CODE);
  const [activeIncident, setActiveIncident] = useState<Vulnerability | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setShowPricing(window.location.pathname === "/pricing");
      setIsSuccess(window.location.pathname === "/success");
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Queries
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({ 
    queryKey: ['projects'], 
    queryFn: dbService.getProjects,
    enabled: isAuthenticated 
  });

  const { data: timelineEvents = [], isLoading: isTimelineLoading } = useQuery({ 
    queryKey: ['timeline'], 
    queryFn: API.getTimeline,
    enabled: isAuthenticated 
  });

  const { data: policies = [], isLoading: isPoliciesLoading } = useQuery({ 
    queryKey: ['policies'], 
    queryFn: API.getPolicies,
    enabled: isAuthenticated 
  });

  const { data: vulnerabilities = [], isLoading: isVulnsLoading } = useQuery({ 
    queryKey: ['vulnerabilities'], 
    queryFn: API.getVulnerabilities,
    enabled: isAuthenticated 
  });

  const { data: drifts = [], isLoading: isDriftsLoading } = useQuery({ 
    queryKey: ['drifts'], 
    queryFn: API.fetchCloudDrifts,
    enabled: isAuthenticated 
  });

  const isInitializing = false; // Bypassed to prevent stuck loading screen

  useEffect(() => {
    if (isAuthenticated && window.location.pathname === '/success') {
      setToast({ message: 'Assinatura atualizada com sucesso!', type: 'success' });
      window.history.replaceState({}, '', '/');
    }
  }, [isAuthenticated]);


  const setPolicies = (action: any) => {
    queryClient.setQueryData(['policies'], (old: Policy[] = []) => {
      if (typeof action === 'function') {
        return action(old);
      }
      return action;
    });
  };

  const setTimelineEvents = (action: any) => {
    queryClient.setQueryData(['timeline'], (old: TimelineEvent[] = []) => {
      if (typeof action === 'function') {
        return action(old);
      }
      return action;
    });
  };

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  const securityScore = useMemo(() => API.calculateScore(vulnerabilities, drifts), [vulnerabilities, drifts]);

  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUnlock = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      setIsSessionLocked(false);
      setIsUnlocking(false);
    }, 1500);
  };

  const onScanFinished = (vulns: Vulnerability[]) => {
    queryClient.setQueryData(['vulnerabilities'], vulns);
    showNotification(`Scan concluído no ambiente ${activeProject?.name || 'Default'}.`);
    API.logEvent({
      type: 'SCAN', title: 'Relatório Gerado',
      description: `Ambiente ${activeProject?.name || 'Default'} analisado. ${vulns.length} riscos encontrados.`,
      severity: vulns.length > 0 ? Severity.HIGH : Severity.LOW
    }).then(evt => queryClient.setQueryData(['timeline'], (old: TimelineEvent[] = []) => [evt, ...old]));
  };

  const handleApplyFix = async (vulnId: string, newSnippet: string) => {
    const targetVuln = vulnerabilities.find((v: Vulnerability) => v.id === vulnId);
    if (!targetVuln) return;
    const resourceParts = targetVuln.resource.split('.');
    const regex = new RegExp(`resource\\s+"${resourceParts[0]}"\\s+"${resourceParts[1]}"\\s*{[\\s\\S]*?}`, 'g');
    if (regex.test(terraformCode)) {
      setTerraformCode(terraformCode.replace(regex, newSnippet));
      const updatedVulns = vulnerabilities.filter((v: Vulnerability) => v.id !== vulnId);
      queryClient.setQueryData(['vulnerabilities'], updatedVulns);
      await API.setVulnerabilities(updatedVulns);
      showNotification("Patch aplicado com sucesso via IA.");
    }
  };

  const handleResolveIncident = (inc: Vulnerability, logs: string[]) => {
    queryClient.setQueryData(['vulnerabilities'], (old: Vulnerability[] = []) => 
      old.map(vi => vi.id === inc.id ? {...inc, status: ScanStatus.RESOLVED, containmentLog: logs} : vi)
    );
    API.logEvent({
      type: 'INCIDENT',
      title: 'Incidente Resolvido',
      description: `Resposta ativa concluída para ${inc.title}. Relatório RCA gerado.`,
      severity: Severity.LOW
    });
    setCurrentView('post-mortem');
  };

  const handleArchitectCode = (code: string) => {
    setTerraformCode(code);
    setCurrentView('scanner');
    showNotification("Blueprint transferido para o Security Forge para análise.");
    API.logEvent({
      type: 'ARCHITECT',
      title: 'Nova Infraestrutura Gerada',
      description: 'Código Terraform criado via IA Architect Studio.',
      severity: Severity.LOW
    }).then(evt => queryClient.setQueryData(['timeline'], (old: TimelineEvent[] = []) => [evt, ...old]));
  };

  if (isInitializing) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Loader2 className="text-primary-500 animate-spin" size={64} />
      <span className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">Connecting to CloudGuardian Core...</span>
    </div>
  );

  const handleQuickDemo = async () => {
    try {
      await login('demo@cloudguardian.dev', 'password123');
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthenticated) {
    if (showLogin) return <Login onLogin={() => setShowLogin(false)} onBack={() => setShowLogin(false)} />;
    
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-black text-white">Pagamento Confirmado!</h1>
          <p className="text-slate-400">Sua assinatura foi ativada com sucesso. Faça login para acessar o CloudGuardian.</p>
          <button onClick={() => { setIsSuccess(false); setShowLogin(true); window.history.pushState({}, '', '/'); }} className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all">
            Ir para o Login
          </button>
        </div>
      </div>
    );
  }

    if (showPricing) return <PricingPage onBack={() => { setShowPricing(false); window.history.pushState({}, "", "/"); }} />;
    return <LandingPage onStart={() => setShowLogin(true)} onViewDemo={handleQuickDemo} onPricing={() => { setShowPricing(true); window.history.pushState({}, "", "/pricing"); }} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {isSessionLocked && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-500">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
           <div className="relative z-10 text-center space-y-8 p-10">
              <div className="w-24 h-24 bg-slate-900 rounded-full border-4 border-slate-800 flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(239,68,68,0.2)]">
                 <Lock size={48} className="text-red-500" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-3xl font-black text-white uppercase tracking-widest">Console Locked</h2>
                 <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.3em]">Security Protocol Active</p>
              </div>
              <button 
                onClick={handleUnlock}
                disabled={isUnlocking}
                className="w-64 py-4 bg-white hover:bg-slate-200 text-slate-950 font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                 {isUnlocking ? <Loader2 className="animate-spin" size={20} /> : <Fingerprint size={20} />}
                 {isUnlocking ? 'Verifying Identity...' : 'Authenticate'}
              </button>
           </div>
        </div>
      )}

      <CommandPalette 
        isOpen={isPaletteOpen} 
        onClose={() => setIsPaletteOpen(false)} 
        onNavigate={setCurrentView}
        actions={{
          toggleAuditor: () => { setIsAuditorMode(prev => !prev); showNotification("Modo Auditor Alternado"); },
          toggleLive: () => setIsLiveAssistantOpen(true),
          logout: logout
        }}
      />
      
      <SystemTerminal isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />

      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      <Sidebar 
        currentView={currentView} 
        onNavigate={(view) => { setCurrentView(view); setIsMobileSidebarOpen(false); }} 
        onLogout={logout} 
        isAuditorMode={isAuditorMode}
        hasActiveIncident={!!activeIncident && activeIncident.status !== ScanStatus.RESOLVED}
        isMobileOpen={isMobileSidebarOpen}
      />
      
      <main className={`flex-1 min-h-screen relative flex flex-col overflow-hidden transition-all duration-300 ${isMobileSidebarOpen ? 'lg:ml-64 blur-sm lg:blur-none' : 'lg:ml-64'}`}>
        {isAuditorMode && <AuditorBanner />}
        <Header 
          isAuditor={isAuditorMode} 
          onToggleAuditor={() => setIsAuditorMode(!isAuditorMode)} 
          notificationsCount={vulnerabilities.length}
          onToggleLiveAssistant={() => setIsLiveAssistantOpen(true)}
          isLiveActive={isLiveAssistantOpen}
          activeProjectId={activeProjectId}
          projects={projects}
          onProjectChange={setActiveProjectId}
          onOpenPalette={() => setIsPaletteOpen(true)}
          onToggleTerminal={() => setIsTerminalOpen(prev => !prev)}
          isTerminalOpen={isTerminalOpen}
          onMobileMenuClick={() => setIsMobileSidebarOpen(true)}
          onLockSession={() => setIsSessionLocked(true)}
        />
        {toast && (
          <div className="fixed top-20 right-8 z-[110] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 border backdrop-blur-md bg-slate-900/90 border-primary-500/20">
            {toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <X size={20} className="text-red-500" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {currentView === 'dashboard' && <Dashboard vulnerabilities={vulnerabilities} drifts={drifts} score={securityScore} timeline={timelineEvents} onNavigate={setCurrentView} policies={policies} runs={pipelineRuns} />}
          {currentView === 'sentinel' && <SentinelMap />}
          {currentView === 'knowledge-base' && <KnowledgeBase />}
          {currentView === 'inventory' && <Inventory />}
          {currentView === 'architect' && <Architect onApplyCode={handleArchitectCode} onNotify={showNotification} />}
          {currentView === 'scanner' && <Scanner code={terraformCode} onCodeChange={setTerraformCode} onScanComplete={onScanFinished} vulnerabilities={vulnerabilities} onApplyFix={handleApplyFix} onSimulateBlast={(v) => { setActiveIncident(v); setCurrentView('war-room'); }} />}
          {currentView === 'organization' && <Organization onNavigate={setCurrentView} onNotify={showNotification} />}
          {currentView === 'graph' && <Graph code={terraformCode} vulnerabilities={vulnerabilities} />}
          {currentView === 'compliance' && <Compliance vulnerabilities={vulnerabilities} />}
          {currentView === 'drift' && <Drift isAuditorMode={isAuditorMode} />}
          {currentView === 'policies' && <PolicyManager policies={policies} setPolicies={setPolicies} onNotify={showNotification} onTimeline={(evt) => setTimelineEvents((prev: TimelineEvent[]) => [evt, ...prev])} />}
          {currentView === 'policy-forge' && <PolicyForge onNotify={showNotification} />}
          {currentView === 'cicd' && <PipelineInsights runs={pipelineRuns} setRuns={setPipelineRuns} onNotify={showNotification} onTimeline={(evt) => setTimelineEvents((prev: TimelineEvent[]) => [evt, ...prev])} />}
          {currentView === 'finops' && <FinOps vulnerabilities={vulnerabilities} />}
          {currentView === 'automation' && <AutomationHub />}
          {currentView === 'sales-playbook' && <SalesPlaybook />}
          {currentView === 'roadmap' && <Roadmap />}
          {currentView === 'report' && <ReportsPage />}
          {currentView === 'timeline' && <Timeline events={timelineEvents} />}
          {currentView === 'settings' && <Settings />}
          {currentView === 'security-tests' && <SecurityTesting />}
          {currentView === 'war-room' && <WarRoom incident={activeIncident} onNotify={showNotification} onClose={() => { setActiveIncident(null); setCurrentView('dashboard'); }} onResolve={handleResolveIncident} />}
          {currentView === 'post-mortem' && <PostMortem incident={activeIncident} onClose={() => { setActiveIncident(null); setCurrentView('dashboard'); }} onNotify={showNotification} />}
        </div>
        {isLiveAssistantOpen && <LiveAssistant codeContext={terraformCode} onClose={() => setIsLiveAssistantOpen(false)} />}
        <AIAssistant code={terraformCode} />
      </main>
    </div>
  );
}

export default App;
