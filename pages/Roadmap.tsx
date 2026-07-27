
import React, { useState } from 'react';
import { 
  CheckCircle2, Rocket, Server, Database, Zap, 
  Users, Lock, Terminal, Radio, DollarSign, FileText, 
  Shield, CreditCard, Layout, Cpu, Activity, Flag, TrendingUp
} from 'lucide-react';

export const Roadmap: React.FC = () => {
  const [activePhase, setActivePhase] = useState<number>(2);

  const roadmapData = [
    {
      phase: 1,
      title: "FASE 1: FRONTEND & UX",
      status: "COMPLETED",
      progress: 95,
      techSpec: `// Status: 95% CONCLUÍDO
- [x] Core UI/Layout: Sidebar, Header, App (Fluido)
- [x] Dashboard HUD: Globo 3D, Gráficos, Animações
- [x] IA Integration: Google Gemini 3 Pro Connected
- [x] Scanner UI: Visualização de Código e Diffs
- [x] War Room: Interface de Incidentes`,
      desc: "Interface de alta fidelidade e integrações locais com IA concluídas.",
      modules: [
        { name: "Visual Engine", desc: "Design System Tactical HUD.", icon: <Layout size={16}/>, impact: "Completed" },
        { name: "Gemini Service", desc: "Conexão com LLM Google.", icon: <Cpu size={16}/>, impact: "Completed" },
        { name: "Interactive Graphs", desc: "Topologia D3/Canvas.", icon: <Activity size={16}/>, impact: "Completed" }
      ]
    },
    {
      phase: 2,
      title: "FASE 2: BACKEND API",
      status: "IN_PROGRESS",
      progress: 10,
      techSpec: `// Status: 0% - CRÍTICO (PRÓXIMO PASSO)
- [ ] API Gateway: Node.js/Express ou NestJS
- [ ] Database Real: PostgreSQL + Prisma (Substituir LocalStorage)
- [ ] Autenticação: JWT Real via Clerk/Auth0
- [ ] Filas: BullMQ/Redis para Scans assíncronos`,
      desc: "Construção do motor real. Substituição dos dados simulados por persistência real em banco de dados.",
      modules: [
        { name: "Node.js Server", desc: "API REST/GraphQL.", icon: <Server size={16}/>, impact: "Critical" },
        { name: "PostgreSQL", desc: "Persistência de dados.", icon: <Database size={16}/>, impact: "Critical" },
        { name: "Auth Security", desc: "Tokens JWT Reais.", icon: <Users size={16}/>, impact: "High" }
      ]
    },
    {
      phase: 3,
      title: "FASE 3: ENGINE DE SEGURANÇA",
      status: "PLANNED",
      progress: 0,
      techSpec: `// Status: 10% (Lógica Simulada)
- [ ] Terraform Runner: Docker Container para 'terraform plan'
- [ ] Static Analysis: Integrar binário Checkov/TFLint no Backend
- [ ] Drift Detection: Cron Job para 'terraform refresh'
- [ ] GitHub App: Webhooks reais para PR Comments`,
      desc: "Implementação da execução remota de ferramentas de segurança (Checkov, TFSec) no servidor.",
      modules: [
        { name: "Docker Runner", desc: "Execução isolada de IaC.", icon: <Terminal size={16}/>, impact: "High" },
        { name: "Static Analyzer", desc: "Integração binária SAST.", icon: <Shield size={16}/>, impact: "High" },
        { name: "Webhook Listener", desc: "GitHub Events Real-time.", icon: <Radio size={16}/>, impact: "Medium" }
      ]
    },
    {
      phase: 4,
      title: "FASE 4: INFRA & DEPLOY",
      status: "VISION",
      progress: 0,
      techSpec: `// Status: 0%
- [ ] Dockerização: Dockerfile para Frontend/Backend
- [ ] CI/CD Próprio: GitHub Actions para Deploy na AWS
- [ ] Monitoramento: Sentry (Erros) + PostHog (Analytics)
- [ ] Billing: Integração Stripe para planos Pro`,
      desc: "Preparação para produção, escala e monetização da plataforma.",
      modules: [
        { name: "Stripe", desc: "Pagamentos e Assinaturas.", icon: <DollarSign size={16}/>, impact: "Revenue" },
        { name: "K8s Cluster", desc: "Orquestração de Containers.", icon: <Server size={16}/>, impact: "Scale" },
        { name: "Monitoring", desc: "Observabilidade total.", icon: <Activity size={16}/>, impact: "Ops" }
      ]
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
      {/* --- STRATEGIC HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/5 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flag size={14} className="text-primary-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Production Roadmap</span>
          </div>
          <h2 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
            Zero to <span className="text-primary-500">Hero</span>
          </h2>
          <p className="text-slate-400 max-w-2xl text-lg font-medium leading-relaxed italic border-l-2 border-primary-500/30 pl-6">
            "Plano estratégico para transformar o protótipo visual em uma plataforma SaaS Enterprise pronta para venda."
          </p>
        </div>

        <div className="flex flex-col gap-4">
           {/* STATUS CARD */}
           <div className="bg-slate-900 border border-white/5 p-6 rounded-[32px] min-w-[240px] text-center shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary-600/5 group-hover:bg-primary-600/10 transition-colors"></div>
              <div className="relative z-10">
                 <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                    <TrendingUp size={12} className="text-primary-500" /> Overall Progress
                 </div>
                 <div className="text-4xl font-black text-white italic tracking-tighter">25%</div>
                 <div className="text-[9px] font-bold text-slate-500 uppercase mt-2">Phase 1 Complete</div>
              </div>
           </div>
        </div>
      </header>

      {/* --- TIMELINE SELECTOR --- */}
      <div className="flex overflow-x-auto gap-4 pb-6 custom-scrollbar scroll-smooth">
         {roadmapData.map((p) => (
           <button 
             key={p.phase}
             onClick={() => setActivePhase(p.phase)}
             className={`shrink-0 w-80 p-8 rounded-[40px] border transition-all duration-500 text-left group relative ${
               activePhase === p.phase 
               ? 'bg-primary-600 border-primary-400 text-white shadow-2xl scale-105' 
               : 'bg-slate-900 border-white/5 text-slate-500 hover:border-slate-700 hover:bg-slate-900/80'
             }`}
           >
              <div className="flex justify-between items-center mb-6">
                 <span className={`text-[10px] font-black uppercase tracking-widest ${activePhase === p.phase ? 'text-primary-100' : 'text-slate-600'}`}>
                    Phase 0{p.phase}
                 </span>
                 {p.status === 'COMPLETED' ? (
                   <CheckCircle2 size={18} className="text-emerald-400" />
                 ) : p.status === 'IN_PROGRESS' ? (
                   <Rocket size={18} className="text-white animate-pulse" />
                 ) : (
                   <Zap size={18} className="text-slate-700" />
                 )}
              </div>
              <h4 className="font-black text-xl uppercase tracking-tighter italic mb-4 leading-tight">{p.title}</h4>
              <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden mb-2">
                <div className={`h-full transition-all duration-1000 ${activePhase === p.phase ? 'bg-white' : 'bg-slate-700'}`} style={{ width: `${p.progress}%` }}></div>
              </div>
              <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Status: {p.status}</div>
           </button>
         ))}
      </div>

      {/* --- DETAILED VIEW ENGINE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 space-y-10">
            <div className="neo-card rounded-[64px] p-12 border border-white/5 relative overflow-hidden bg-slate-900/40 shadow-inner">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
               
               <div className="space-y-12 relative z-10">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                     <div className="space-y-3">
                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${
                          roadmapData[activePhase-1].status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          roadmapData[activePhase-1].status === 'IN_PROGRESS' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' :
                          'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                           Foco Atual
                        </div>
                        <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                           {roadmapData[activePhase-1].title}
                        </h3>
                        <p className="text-slate-400 text-lg leading-relaxed italic max-w-2xl font-medium">
                          "{roadmapData[activePhase-1].desc}"
                        </p>
                     </div>
                  </div>

                  {/* High Tech Spec Window */}
                  <div className="bg-black/60 rounded-[40px] border border-white/5 p-8 relative shadow-2xl group overflow-hidden">
                     <div className="flex items-center gap-3 mb-6 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5 pb-4">
                        <Terminal size={16} className="text-emerald-500" /> Spec Técnica
                     </div>
                     <pre className="text-primary-400 font-mono text-xs leading-relaxed overflow-x-auto custom-scrollbar italic">
                        {roadmapData[activePhase-1].techSpec}
                     </pre>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {roadmapData[activePhase-1].modules.map((m, i) => (
                       <div key={i} className="p-8 bg-slate-950/60 border border-white/5 rounded-[40px] group hover:border-primary-500/30 transition-all hover:-translate-y-2 shadow-xl flex flex-col justify-between h-48">
                          <div>
                            <div className="flex justify-between items-start mb-6">
                               <div className="p-4 bg-white/5 rounded-2xl text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-inner">
                                  {m.icon}
                                </div>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{m.impact}</span>
                            </div>
                            <h5 className="text-sm font-black text-white mb-2 uppercase tracking-tight">{m.name}</h5>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-tighter">{m.desc}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* --- ACTION SIDEBAR --- */}
         <div className="lg:col-span-4 space-y-8">
            <div className="neo-card rounded-[56px] p-10 space-y-10 border border-primary-500/20 bg-slate-900/60 shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
               <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 relative z-10">
                 <Terminal size={20} className="text-primary-500" /> Próximos Passos
               </h3>
               
               <div className="space-y-6 relative z-10">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ação Recomendada</span>
                     <p className="text-xs text-white font-medium leading-relaxed">
                        Configurar servidor <strong>Node.js</strong> para substituir o mock do frontend.
                     </p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Dependência Crítica</span>
                     <p className="text-xs text-white font-medium leading-relaxed">
                        Migrar <code>dbService.ts</code> (LocalStorage) para <strong>PostgreSQL</strong>.
                     </p>
                  </div>
               </div>

               <button className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/40 relative z-10">
                  Iniciar Migração Backend
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};
