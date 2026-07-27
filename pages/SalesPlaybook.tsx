
import React, { useState } from 'react';
import { 
  Target, MessageSquare, Mail, PlayCircle, Copy, Check, 
  ChevronRight, Users, Briefcase, Zap, AlertCircle, TrendingUp,
  Clock, Mic, Award, Sparkles, Navigation
} from 'lucide-react';

export const SalesPlaybook: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
              <Mic size={12} />
              Sales Ops & Enablement
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Sales Playbook & Outreach Hub</h1>
            <p className="text-slate-400 max-w-3xl text-lg">
              Guia estratégico de vendas, scripts de prospecção e o roadmap para atingir USD 5k MRR.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl h-fit">
            <NavButton onClick={() => scrollToSection('demo-script')} label="Demo Script" icon={<PlayCircle size={14}/>} />
            <NavButton onClick={() => scrollToSection('growth-roadmap')} label="Growth Roadmap" icon={<TrendingUp size={14}/>} />
            <NavButton onClick={() => scrollToSection('outreach-hub')} label="Outreach Hub" icon={<Users size={14}/>} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Column 1: Demo & Strategy */}
        <div className="xl:col-span-2 space-y-12">
          <section id="demo-script" className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl scroll-mt-24">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlayCircle className="text-primary-500" size={20} />
                Estrutura de Demo (15 Minutos)
              </h2>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Script Interativo</span>
            </div>
            <div className="p-8 space-y-8">
              <DemoStep 
                time="0-2 min" 
                title="Abertura & Conexão" 
                goal="Fazer o cliente verbalizar o problema de segurança."
                script="Antes de mostrar a ferramenta, quero entender rapidamente: hoje, quem é responsável por segurança e compliance na sua infra? E quando aparece um alerta, isso vira prioridade ou fica para depois?"
              />
              <DemoStep 
                time="2-5 min" 
                title="Posicionamento de Valor" 
                goal="Diferenciar do scanner comum (Alertar vs Corrigir)."
                script="A maioria das ferramentas apenas encontra problemas e gera dashboards barulhentos. O CloudGuardian é focado em ação: Scan → Risco → Pull Request Automático → Evidência de Auditoria."
              />
              <DemoStep 
                time="5-11 min" 
                title="Momento 'Uau' (Auto-PR)" 
                goal="Mostrar o PR sendo criado ao vivo no GitHub."
                script="Vou rodar um scan agora... Veja este S3 Público. Em vez de te dar um alerta, vou clicar em 'Create Fix PR'. Veja o branch criado e o Diff com a correção real. Isso é o que normalmente custa horas do time."
              />
              <DemoStep 
                time="11-15 min" 
                title="Fechamento & Founder Deal" 
                goal="Aproveitar a escassez do plano inicial."
                script="Uma única falha dessas pode custar milhares. O plano Pro custa $99/mês, mas para os primeiros 10 clientes, estou liberando o 'Founder Deal' por $79. Faz sentido rodarmos um scan no seu repo real agora?"
              />
            </div>
          </section>

          <section id="growth-roadmap" className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 scroll-mt-24">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={20} />
                Roadmap para $5k MRR (90 Dias)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RoadmapCard phase="Fase 1 (D1-30)" goal="5 Clientes" desc="Outreach manual, 10 contatos/dia. Foco em validar a dor real." />
                <RoadmapCard phase="Fase 2 (D31-60)" goal="15 Clientes" desc="Mini-cases reais. 'Cliente X corrigiu 17 falhas em 7 dias'." />
                <RoadmapCard phase="Fase 3 (D61-90)" goal="32 Clientes" desc="Indicações de consultores e agências. Escala de confiança." />
             </div>
          </section>
        </div>

        {/* Column 2: Outreach Hub */}
        <div id="outreach-hub" className="space-y-8 scroll-mt-24">
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
              <Users size={20} />
              Outreach Toolkit
            </div>
            
            <div className="space-y-8">
              <TemplateCard 
                icon={<MessageSquare className="text-primary-400" size={16} />}
                title="LinkedIn: Pergunta Técnica (Abridor)"
                text="Obrigado por aceitar! Rápida pergunta: hoje, quando surge uma falha de segurança no seu Terraform, isso vira um PR automático ou alguém do time tem que corrigir manualmente?"
                onCopy={(text) => copyToClipboard(text, 'li-abridor')}
                isCopied={copiedId === 'li-abridor'}
              />

              <TemplateCard 
                icon={<Sparkles className="text-amber-400" size={16} />}
                title="Script: O 'Founder Deal'"
                text="Como estamos fechando o grupo de 10 fundadores iniciais, consigo liberar o acesso Pro por $79 fixo, em vez de $99. É um trade-off pelo seu feedback constante."
                onCopy={(text) => copyToClipboard(text, 'founder-deal')}
                isCopied={copiedId === 'founder-deal'}
              />

              <TemplateCard 
                icon={<Mail className="text-emerald-400" size={16} />}
                title="Email: Gancho Direto"
                text={`Assunto: Pull Request automático para falhas Terraform\n\nOlá {{Nome}},\n\nVi que vocês usam Terraform. Hoje, quando surge uma falha (S3 público, etc), isso vira tarefa manual.\n\nO CloudGuardian detecta e cria PRs com correções automáticas. Podemos falar 15 min na terça?`}
                onCopy={(text) => copyToClipboard(text, 'email-cold')}
                isCopied={copiedId === 'email-cold'}
              />

              <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl space-y-3">
                 <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Award size={14} />
                    Frase de Ouro
                 </h4>
                 <p className="text-xs text-slate-500 italic leading-relaxed">
                    "Alertar é fácil. Corrigir é o difícil. Nós fazemos o difícil."
                 </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ label, icon, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
  >
    {icon}
    {label}
  </button>
);

const DemoStep = ({ time, title, goal, script }: any) => (
  <div className="flex gap-6 group">
    <div className="flex flex-col items-center">
      <div className="w-16 text-[10px] font-black text-primary-500 bg-primary-500/10 px-2 py-1 rounded-lg border border-primary-500/20 text-center uppercase tracking-widest">
        {time}
      </div>
      <div className="w-px flex-1 bg-slate-800 my-2 group-last:hidden"></div>
    </div>
    <div className="flex-1 space-y-2 pb-8">
      <h3 className="font-bold text-white text-md flex items-center gap-2">
        {title}
        <ChevronRight size={14} className="text-slate-600" />
      </h3>
      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
        <Zap size={10} className="text-amber-500" />
        Objetivo: {goal}
      </div>
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-400 italic leading-relaxed relative group">
        "{script}"
      </div>
    </div>
  </div>
);

const RoadmapCard = ({ phase, goal, desc }: any) => (
  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
     <div className="text-[10px] font-black text-primary-400 uppercase tracking-widest">{phase}</div>
     <div className="text-lg font-bold text-white">{goal}</div>
     <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-bold">{desc}</p>
  </div>
);

const TemplateCard = ({ icon, title, text, onCopy, isCopied }: any) => (
  <div className="space-y-3 group">
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-xs font-bold text-white tracking-tight">{title}</h4>
       </div>
       <button 
          onClick={() => onCopy(text)}
          className={`p-1.5 rounded-lg transition-all ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
       >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
       </button>
    </div>
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500 leading-relaxed font-mono">
      {text}
    </div>
  </div>
);
