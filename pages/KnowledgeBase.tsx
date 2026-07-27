
import React, { useState } from 'react';
import { 
  Book, Zap, Shield, GitPullRequest, Radar, Box, Hammer, 
  Terminal, Gavel, DollarSign, Globe, CheckCircle2, ChevronRight,
  Target, Rocket, Code, Database, Search, History, Lock,
  Activity, RefreshCw, LayoutTemplate, Network, FlaskConical, Users, Settings
} from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600/10 border border-primary-500/20 rounded-xl text-primary-500">
            <Book size={20} />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Knowledge & Strategy Center</span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
          Console <span className="text-primary-500">Manual</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-lg font-medium italic">
          Documentação técnica operacional completa e roadmap de engenharia.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Navigation Rail */}
        <aside className="lg:col-span-3 space-y-8 h-fit sticky top-8">
           <div className="space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
              <div className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Core Modules</div>
              <NavButton active={activeSection === 'overview'} onClick={() => setActiveSection('overview')} label="1. Visão Geral" />
              <NavButton active={activeSection === 'forge'} onClick={() => setActiveSection('forge')} label="2. Security Forge" />
              <NavButton active={activeSection === 'sentinel'} onClick={() => setActiveSection('sentinel')} label="3. Sentinel Radar" />
              <NavButton active={activeSection === 'war-room'} onClick={() => setActiveSection('war-room')} label="4. War Room & Forensics" />
              
              <div className="px-4 py-2 mt-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Operations</div>
              <NavButton active={activeSection === 'drift'} onClick={() => setActiveSection('drift')} label="5. Drift Monitor" />
              <NavButton active={activeSection === 'inventory'} onClick={() => setActiveSection('inventory')} label="6. Asset Inventory" />
              <NavButton active={activeSection === 'graph'} onClick={() => setActiveSection('graph')} label="7. Topology Graph" />
              <NavButton active={activeSection === 'tests'} onClick={() => setActiveSection('tests')} label="8. Security Testing Lab" />
              
              <div className="px-4 py-2 mt-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Management</div>
              <NavButton active={activeSection === 'policies'} onClick={() => setActiveSection('policies')} label="9. Policy Forge" />
              <NavButton active={activeSection === 'finops'} onClick={() => setActiveSection('finops')} label="10. FinOps Advisor" />
              <NavButton active={activeSection === 'cicd'} onClick={() => setActiveSection('cicd')} label="11. CI/CD Pipeline" />
              <NavButton active={activeSection === 'rbac'} onClick={() => setActiveSection('rbac')} label="12. RBAC & Settings" />
              
              <div className="h-4"></div>
              <NavButton active={activeSection === 'roadmap'} onClick={() => setActiveSection('roadmap')} label="📍 Tech Roadmap Status" />
           </div>

           <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] space-y-3">
              <div className="flex items-center gap-2">
                 <CheckCircle2 size={14} className="text-emerald-500" />
                 <span className="text-[9px] font-black text-white uppercase">Audit Ready</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase">
                 Esta documentação cumpre com os requisitos de treinamento SOC2 Controle CC7.1.
              </p>
           </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9 bg-slate-900/40 border border-white/5 rounded-[48px] p-12 shadow-2xl relative overflow-hidden min-h-[800px]">
           <div className="absolute top-0 right-0 p-12 opacity-5">
              <Zap size={200} className="text-primary-500" />
           </div>

           {activeSection === 'overview' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-4">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">O Que é o <span className="text-primary-500">CloudGuardian</span>?</h2>
                   <p className="text-slate-400 leading-relaxed text-lg font-medium">
                      O CloudGuardian é uma plataforma de **Automação de Segurança para Nuvem (CSPM & IaC Security)** projetada para startups e empresas SaaS. 
                      Ao contrário de scanners passivos, o CloudGuardian age no código para corrigir vulnerabilidades antes que elas cheguem em produção.
                   </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FeatureSnippet icon={<Shield/>} title="Zero-Trust IaC" desc="Análise profunda de Terraform HCL contra 400+ políticas de segurança." />
                   <FeatureSnippet icon={<GitPullRequest/>} title="Auto-PR" desc="Criação automática de Pull Requests de correção via IA Gemini." />
                   <FeatureSnippet icon={<Globe/>} title="Compliance" desc="Mapeamento nativo para SOC2, ISO27001 e HIPAA." />
                   <FeatureSnippet icon={<Radar/>} title="Incident Response" desc="Módulo de War Room para contenção de ameaças em tempo real." />
                </div>
             </div>
           )}

           {activeSection === 'forge' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 2: <span className="text-primary-500">Security Forge</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      O **Security Forge** (Scanner) é o laboratório onde a infraestrutura é testada. Ele utiliza o motor de raciocínio Gemini 3 Pro para detectar falhas lógicas que scanners baseados apenas em regex ignoram.
                   </p>
                   
                   <div className="space-y-4">
                      <Step label="1. Input de Código" desc="Cole seu código Terraform ou conecte via GitHub Action. O sistema suporta HCL nativo." />
                      <Step label="2. Scan & Razão" desc="A IA analisa o contexto (ex: um S3 público pode ser erro ou necessidade de negócio baseada em tags)." />
                      <Step label="3. Remediação" desc="Clique em 'Gerar Remediação IA' para ver o Diff sugerido e criar um PR automaticamente." />
                   </div>
                </section>

                <div className="bg-slate-950 border border-white/5 rounded-3xl p-6 font-mono text-[11px] text-primary-400">
                   <p className="text-slate-600 mb-2">// Exemplo de Análise IA:</p>
                   <p>Resource: aws_security_group.allow_ssh</p>
                   <p>Finding: Port 22 open to 0.0.0.0/0</p>
                   <p className="text-emerald-500">Fix Suggestion: Restrict CIDR to VPN IP or use SSM Session Manager.</p>
                </div>
             </div>
           )}

           {activeSection === 'sentinel' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 3: <span className="text-primary-500">Sentinel Radar</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      O **Sentinel Radar** é a nossa rede de inteligência global. Ele monitora feeds de ameaças externas e correlaciona automaticamente com a sua lista de ativos.
                   </p>
                   
                   <div className="p-8 bg-primary-600/5 border border-primary-500/20 rounded-[40px] space-y-4">
                      <h4 className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                        <Target size={16} className="text-primary-500" /> Fluxo de Correlação
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase">
                         1. Sentinel detecta nova CVE em 'aws_db_instance' em us-east-1.<br/>
                         2. Sistema varre seu 'Asset Inventory' procurando recursos compatíveis.<br/>
                         3. Alerta crítico é disparado no Dashboard se houver match.<br/>
                         4. Sugestão de isolamento preventivo é gerada via IA.
                      </p>
                   </div>
                </section>
             </div>
           )}

           {activeSection === 'war-room' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 4: <span className="text-primary-500">War Room & Forensics</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      Em caso de incidente confirmado, o módulo de War Room assume o controle para resposta a incidentes (IR).
                   </p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-950 border border-white/5 rounded-3xl space-y-3">
                         <div className="p-2 bg-red-500/10 rounded-xl text-red-500 w-fit"><Lock size={16}/></div>
                         <h5 className="font-bold text-white text-xs uppercase">Tactical Containment</h5>
                         <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">Bloqueio imediato de acesso, rotação de chaves e snapshots forenses automatizados via API do Cloud Provider.</p>
                      </div>
                      <div className="p-6 bg-slate-950 border border-white/5 rounded-3xl space-y-3">
                         <div className="p-2 bg-primary-500/10 rounded-xl text-primary-500 w-fit"><History size={16}/></div>
                         <h5 className="font-bold text-white text-xs uppercase">Post-Mortem Engine</h5>
                         <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">Reconstituição do ataque e geração de relatórios de causa raiz (RCA) assinados para auditores.</p>
                      </div>
                   </div>
                </section>
             </div>
           )}

           {activeSection === 'drift' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 5: <span className="text-primary-500">Drift Monitor</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      O **Drift Monitor** detecta alterações manuais na nuvem (ClickOps) que não estão refletidas no código Terraform. Isso é vital para manter a integridade do estado e evitar "Shadow IT".
                   </p>
                   
                   <div className="space-y-4">
                      <Step label="1. Snapshot Comparativo" desc="O sistema compara o `terraform.tfstate` com a API da AWS/Azure em tempo real." />
                      <Step label="2. Alerta de Divergência" desc="Se alguém abriu a porta 22 manualmente no console da AWS, o Drift alerta." />
                      <Step label="3. Overwrite" desc="Botão de 'Overwrite Cloud State' para forçar a configuração segura do código sobre a alteração manual." />
                   </div>
                </section>
             </div>
           )}

           {activeSection === 'inventory' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 6: <span className="text-primary-500">Asset Inventory</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      Catálogo centralizado de todos os recursos (EC2, S3, RDS, etc.) em todas as clouds conectadas.
                   </p>
                   <ul className="list-disc pl-6 space-y-2 text-slate-400 text-sm">
                      <li>Busca unificada por Tag, ID ou Região.</li>
                      <li>Cálculo de Custo Mensal Estimado por recurso.</li>
                      <li>Score de Risco individual para priorização de patches.</li>
                   </ul>
                </section>
             </div>
           )}

           {activeSection === 'graph' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 7: <span className="text-primary-500">Topology Graph</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      Visualização gráfica das dependências da infraestrutura. Vital para entender o "Blast Radius" (Raio de Explosão) de um ataque.
                   </p>
                   <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] text-slate-400 font-mono">
                      Se o Banco de Dados (Node A) for comprometido, quais Aplicações (Nodes B, C) param? O gráfico responde isso visualmente.
                   </div>
                </section>
             </div>
           )}

           {activeSection === 'tests' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 8: <span className="text-primary-500">Security Testing Lab</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      Execução de testes de segurança ativos e passivos:
                   </p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                         <h4 className="font-bold text-white mb-2">SAST (Static)</h4>
                         <p className="text-xs text-slate-500">Análise do código Terraform (Checkov, tfsec).</p>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                         <h4 className="font-bold text-white mb-2">DAST (Dynamic)</h4>
                         <p className="text-xs text-slate-500">Simulação de ataques (OWASP ZAP) em endpoints vivos.</p>
                      </div>
                   </div>
                </section>
             </div>
           )}

           {activeSection === 'policies' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 9: <span className="text-primary-500">Policy Forge</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      Interface para criação de "Guardrails" customizados. Permite definir regras de negócio específicas (ex: "Nenhum recurso pode ser criado fora de us-east-1").
                   </p>
                   <p className="text-sm text-slate-500">Utiliza lógica similar a OPA (Open Policy Agent) mas com interface visual simplificada.</p>
                </section>
             </div>
           )}

           {activeSection === 'finops' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 10: <span className="text-primary-500">FinOps Advisor</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      Otimização de custos integrada à segurança. Identifica recursos superdimensionados ou ociosos no código IaC.
                   </p>
                   <ul className="list-disc pl-6 space-y-2 text-slate-400 text-sm">
                      <li>Identificação de instâncias `xlarge` em ambientes de desenvolvimento.</li>
                      <li>Sugestão de uso de `t3.medium` ou Spot Instances.</li>
                      <li>Cálculo de ROI (Retorno sobre Investimento) baseado na remediação.</li>
                   </ul>
                </section>
             </div>
           )}

           {activeSection === 'cicd' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 11: <span className="text-primary-500">CI/CD Pipeline</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      O **Pipeline Insights** mostra como o CloudGuardian se integra ao GitHub Actions ou GitLab CI. Ele age como um "Quality Gate" que bloqueia PRs inseguros.
                   </p>
                   <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-[11px] text-slate-400">
                      <p># Exemplo de bloqueio no GitHub Actions</p>
                      <p>- name: Run CloudGuardian</p>
                      <p>&nbsp;&nbsp;uses: cloudguardian/scanner-action@v1</p>
                      <p>&nbsp;&nbsp;with:</p>
                      <p>&nbsp;&nbsp;&nbsp;&nbsp;fail_on_critical: true <span className="text-emerald-500"># Bloqueia o merge se houver risco crítico</span></p>
                   </div>
                </section>
             </div>
           )}

           {activeSection === 'rbac' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-6">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Módulo 12: <span className="text-primary-500">RBAC & Settings</span></h2>
                   <p className="text-slate-400 text-lg leading-relaxed">
                      Gestão de acesso e configurações globais.
                   </p>
                   <ul className="list-disc pl-6 space-y-2 text-slate-400 text-sm">
                      <li>**Role Based Access Control:** Defina quem é Admin, Editor ou Auditor (Read-only).</li>
                      <li>**Modo Auditor:** Visualização especial para auditores externos acessarem evidências sem risco de alterar a infraestrutura.</li>
                      <li>**Settings:** Configuração de chaves de API (AWS/Azure) e webhooks para Slack.</li>
                   </ul>
                </section>
             </div>
           )}

           {activeSection === 'roadmap' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                <section className="space-y-2">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Roadmap <span className="text-primary-500">Técnico</span></h2>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Status de Implementação Atual vs Futuro</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                         <CheckCircle2 size={14}/> Implementado (DONE)
                      </h4>
                      <div className="space-y-3">
                         <RoadmapItem title="Scanner IaC (Terraform)" desc="Análise estática de HCL no browser (Mock + Regex)." status="Done" />
                         <RoadmapItem title="Integração Gemini 3 Pro" desc="Raciocínio complexo para correções e análise de contexto." status="Done" />
                         <RoadmapItem title="Drift Detection (Simulado)" desc="Comparação de estado local vs remoto (Mock API)." status="Done" />
                         <RoadmapItem title="War Room & Logs" desc="Interface de resposta a incidentes e geração de RCA." status="Done" />
                         <RoadmapItem title="Live Voice Assistant" desc="Consultor de segurança por voz em tempo real (Gemini Live API)." status="Done" />
                         <RoadmapItem title="Security Graph" desc="Visualização de topologia e raio de explosão." status="Done" />
                         <RoadmapItem title="Inventory & Dashboard" desc="Listagem de ativos e KPIs de segurança." status="Done" />
                      </div>
                   </div>
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest flex items-center gap-2">
                         <Rocket size={14} className="animate-pulse" /> Backlog (TODO / MOCKED)
                      </h4>
                      <div className="space-y-3">
                         <RoadmapItem title="GitHub App Nativo" desc="Integração real via OAuth com permissão de escrita nos repositórios para criar PRs reais." status="Planned" />
                         <RoadmapItem title="AWS/Azure SDK Real" desc="Substituir mocks por chamadas reais via AWS SDK v3 para listar assets e aplicar correções." status="In Dev" />
                         <RoadmapItem title="Multi-User Realtime" desc="Colaboração via WebSockets (Socket.io) para War Room compartilhado." status="Research" />
                         <RoadmapItem title="Jira Integration" desc="Criação automática de tickets para falhas detectadas." status="Backlog" />
                         <RoadmapItem title="Custom OPA Engine" desc="Execução de Rego policies via WASM no browser para performance." status="Future" />
                         <RoadmapItem title="Autonomous DAO" desc="Sistema descentralizado de governança de segurança." status="Vision" />
                      </div>
                   </div>
                </div>
             </div>
           )}

        </main>
      </div>
    </div>
  );
};

const NavButton = ({ label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 text-left group my-1 ${
      active ? 'bg-primary-600 text-white shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5'
    }`}
  >
     <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
     {active && <ChevronRight size={14} />}
  </button>
);

const FeatureSnippet = ({ icon, title, desc }: any) => (
  <div className="p-6 bg-slate-950/40 border border-white/5 rounded-3xl space-y-3 hover:border-primary-500/30 transition-all group">
     <div className="p-2 bg-primary-500/10 rounded-xl text-primary-500 group-hover:scale-110 transition-transform w-fit">{icon}</div>
     <h4 className="text-xs font-black text-white uppercase">{title}</h4>
     <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">{desc}</p>
  </div>
);

const Step = ({ label, desc }: any) => (
  <div className="flex gap-4 group">
     <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-[10px] font-black text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
          {label[0]}
        </div>
        <div className="w-px flex-1 bg-white/5 my-1"></div>
     </div>
     <div className="pb-6">
        <h5 className="text-xs font-black text-white uppercase mb-1">{label}</h5>
        <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">{desc}</p>
     </div>
  </div>
);

const RoadmapItem = ({ title, desc, status }: any) => (
  <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
     <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-black text-slate-300 uppercase group-hover:text-white transition-colors">{title}</span>
        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
          status === 'Done' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
          status === 'In Dev' ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 
          'bg-slate-800 text-slate-600 border border-slate-700'
        }`}>{status}</span>
     </div>
     <p className="text-[9px] text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);
