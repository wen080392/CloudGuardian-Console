
import React from 'react';
import { 
  Shield, GitPullRequest, Clock, FileCheck, ArrowRight, Zap, 
  Lock, AlertCircle, CheckCircle2, Globe, Users, TrendingUp, 
  ChevronRight, Award, BarChart3, Rocket 
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onViewDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps & { onPricing?: () => void }> = ({ onStart, onViewDemo, onPricing }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-slate-950 text-slate-200 overflow-x-hidden selection:bg-primary-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Shield className="text-primary-500" size={24} />
            <span className="text-xl font-black text-white tracking-tighter uppercase">CloudGuardian</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
            <button onClick={() => scrollToSection('solucao')} className="hover:text-white transition-colors">Solução</button>
            <button onClick={() => scrollToSection('como-funciona')} className="hover:text-white transition-colors">Como Funciona</button>
            <button onClick={() => scrollToSection('precos')} className="hover:text-white transition-colors">Preços</button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onStart} className="text-sm font-bold text-white hover:text-primary-400 transition-colors">Entrar</button>
            <button 
              onClick={onStart}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-primary-900/20"
            >
              Começar Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-primary-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
            <Rocket size={12} />
            DevSecOps Autônomo para Startups
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Pare de apenas alertar riscos.<br/>
            <span className="bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">Corrija via Pull Request.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            O CloudGuardian detecta riscos na sua infraestrutura Terraform, monitora compliance e resolve problemas sozinho via PR no GitHub. Segurança que age, não apenas apita.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-primary-900/40 flex items-center justify-center gap-2 text-lg group"
            >
              Começar grátis por 14 dias
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onViewDemo}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 text-lg"
            >
              Ver demo ao vivo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 max-w-4xl mx-auto">
            <HeroBullet icon={<GitPullRequest className="text-primary-400" />} text="Auto-Remediação via Pull Request" />
            <HeroBullet icon={<Clock className="text-indigo-400" />} text="Timeline auditável de segurança" />
            <HeroBullet icon={<FileCheck className="text-emerald-400" />} text="Compliance SOC2 e ISO sem planilhas" />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-slate-900/30 border-y border-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Segurança em Cloud está quebrada para startups e SaaS</h2>
            <div className="space-y-4 text-slate-400 leading-relaxed">
              <p>Times pequenos precisam lidar com:</p>
              <ul className="space-y-3">
                <ProblemItem text="Infraestrutura Terraform crescendo rápido" />
                <ProblemItem text="Falta de time dedicado de segurança" />
                <ProblemItem text="Medo constante de vazamento de dados" />
                <ProblemItem text="Auditorias SOC2 caras e demoradas" />
                <ProblemItem text="Ferramentas enterprise complexas demais" />
              </ul>
              <p className="pt-2 text-white font-semibold">Resultado: riscos ignorados, correções manuais e noites sem dormir.</p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertCircle size={120} />
             </div>
             <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3 text-red-500">
                   <AlertCircle size={24} />
                   <span className="font-bold uppercase tracking-widest text-xs">Ameaças Detectadas</span>
                </div>
                <div className="space-y-3">
                   <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-between">
                      <span className="text-sm font-mono text-slate-300">aws_s3_bucket.logs</span>
                      <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">PUBLIC_READ</span>
                   </div>
                   <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex items-center justify-between">
                      <span className="text-sm font-mono text-slate-300">aws_security_group.db</span>
                      <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">PORT_22_OPEN</span>
                   </div>
                </div>
                <div className="pt-4 flex justify-center">
                   <div className="text-center">
                      <div className="text-4xl font-black text-white">47%</div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Das falhas são erros humanos</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solucao" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
          <h2 className="text-4xl font-black text-white tracking-tight">Segurança que age, não só alerta</h2>
          <p className="text-slate-400 text-lg">
            O CloudGuardian não é apenas mais um scanner. Ele analisa sua infraestrutura (Terraform, secrets, drift), identifica riscos reais e <strong>cria Pull Requests com correções automáticas</strong>.
          </p>
          <p className="text-primary-400 font-bold uppercase tracking-widest text-xs pt-4">Sem ruído. Sem dashboards confusos. Sem trabalho manual.</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={<Zap className="text-primary-400" />} 
            title="Auto-PR via IA" 
            desc="Correções reais direto no código Terraform, prontas para merge."
          />
          <FeatureCard 
            icon={<Clock className="text-indigo-400" />} 
            title="Security Timeline" 
            desc="Histórico completo de riscos, correções e compliance."
          />
          <FeatureCard 
            icon={<Lock className="text-amber-400" />} 
            title="Modo Auditor" 
            desc="Acesso read-only para auditores e compliance officers."
          />
          <FeatureCard 
            icon={<FileCheck className="text-emerald-400" />} 
            title="Relatórios SOC2 / ISO" 
            desc="PDF e JSON exportáveis para evidência contínua."
          />
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-24 px-6 bg-slate-900/20">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white">Como Funciona</h2>
            <p className="text-slate-500">Do repositório ao compliance em 4 passos simples.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Step number="1" title="Conecte seu repo" desc="Login com GitHub e escolha o repositório Terraform." />
            <Step number="2" title="Execute o scan" desc="Detectamos secrets, falhas e problemas de compliance." />
            <Step number="3" title="Corrija via PR" desc="Com um clique, criamos o Pull Request de correção." />
            <Step number="4" title="Evidência Contínua" desc="Tudo registrado na Security Timeline para auditoria." />
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[32px] p-8 md:p-16 flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
              <Award size={12} />
              Compliance Real-time
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">Compliance sem dor, não corrida de última hora</h2>
            <div className="space-y-4 text-slate-400">
              <p>Acompanhe o progresso SOC2 e ISO em tempo real, veja quais controles já estão atendidos e gere evidências automaticamente.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <CheckItem text="Sem planilhas manuais" />
                <CheckItem text="Sem screenshots infinitas" />
                <CheckItem text="Sem stress pré-auditoria" />
                <CheckItem text="Maturidade real provada" />
              </div>
            </div>
          </div>
          <div className="w-full lg:w-[400px] space-y-4">
             <ComplianceWidget framework="SOC2" score={85} />
             <ComplianceWidget framework="ISO 27001" score={72} />
             <ComplianceWidget framework="HIPAA" score={94} />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white">Planos que crescem com você</h2>
            <p className="text-slate-500">Teste grátis por 14 dias — sem compromisso.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PriceCard 
              onPricing={onPricing} tier="Starter" 
              price="29" 
              desc="Para testar e visualizar riscos" 
              features={["Scans básicos", "Security Score", "Timeline (7 dias)"]} 
              disabledFeatures={["Correções Automáticas", "Compliance Pro"]}
            />
            <PriceCard 
              onPricing={onPricing} tier="Pro" 
              price="99" 
              popular 
              desc="Para quem quer resolver de verdade" 
              features={["Auto-Remediação via PR", "Timeline completa", "Compliance SOC2 + ISO", "Exportação PDF"]} 
            />
            <PriceCard 
              onPricing={onPricing} tier="Business" 
              price="249" 
              desc="Para auditoria e escala" 
              features={["Modo Auditor", "Exportações ilimitadas", "Compliance avançado", "Projetos ilimitados"]} 
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 border-t border-slate-900">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-3xl font-bold text-white tracking-tight">Por que CTOs escolhem o CloudGuardian</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
             <Testimonial quote="Por menos de USD 100/mês, corrigimos riscos que custariam milhares em consultoria." author="Alex Rivera, CTO @ FinTech Start" />
             <Testimonial quote="A Timeline de segurança nos salvou semanas de trabalho durante a auditoria SOC2." author="Sarah Chen, Head of Engineering @ SaaSScale" />
          </div>
          <div className="pt-8 flex flex-wrap justify-center gap-12 opacity-30 grayscale items-center">
             <span className="text-xl font-black italic">CLOUDFLOW</span>
             <span className="text-xl font-black italic">TERRAFORMERS</span>
             <span className="text-xl font-black italic">SECURELY</span>
             <span className="text-xl font-black italic">SaaS_FOUNDATION</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-600/10 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Pare de apenas monitorar riscos. <br/> Comece a corrigi-los.</h2>
          <p className="text-slate-400 text-lg">
            Leva menos de 5 minutos para conectar seu repositório e gerar o primeiro Pull Request de segurança.
          </p>
          <button 
            onClick={onStart}
            className="px-10 py-5 bg-primary-600 hover:bg-primary-700 text-white text-xl font-bold rounded-2xl transition-all shadow-2xl shadow-primary-900/50 flex items-center justify-center gap-3 mx-auto"
          >
            Começar agora — 14 dias grátis
            <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Shield className="text-primary-500" size={24} />
          <span className="text-xl font-black text-white tracking-tighter uppercase">CloudGuardian</span>
        </div>
        <p className="text-slate-600 text-xs">© 2025 CloudGuardian Inc. Todos os direitos reservados. Made for security builders.</p>
      </footer>
    </div>
  );
};

const HeroBullet = ({ icon, text }: any) => (
  <div className="flex items-center gap-3 text-slate-300 font-medium">
    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">{icon}</div>
    <span className="text-sm">{text}</span>
  </div>
);

const ProblemItem = ({ text }: any) => (
  <li className="flex items-center gap-2 text-slate-400">
    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
    {text}
  </li>
);

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-primary-500/30 transition-all hover:bg-slate-900/60">
    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 w-fit">{icon}</div>
    <h3 className="text-lg font-bold text-white">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const Step = ({ number, title, desc }: any) => (
  <div className="space-y-4 text-center">
    <div className="w-10 h-10 bg-primary-600 text-white font-black rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary-900/20">{number}</div>
    <h4 className="font-bold text-white">{title}</h4>
    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const CheckItem = ({ text }: any) => (
  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
    <CheckCircle2 size={16} className="text-emerald-500" />
    {text}
  </div>
);

const ComplianceWidget = ({ framework, score }: any) => (
  <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
    <div className="flex items-center gap-3">
       <div className="w-10 h-10 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-primary-400 font-bold text-xs">{framework[0]}</div>
       <span className="text-sm font-bold text-slate-200">{framework}</span>
    </div>
    <div className="flex items-center gap-2">
       <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${score}%` }}></div>
       </div>
       <span className="text-xs font-black text-emerald-500">{score}%</span>
    </div>
  </div>
);

const PriceCard = ({ tier, price, desc, features, disabledFeatures = [], popular = false, onPricing }: any) => (
  <div className={`p-8 rounded-[32px] border flex flex-col relative ${popular ? 'bg-primary-600/5 border-primary-500 shadow-2xl shadow-primary-900/10' : 'bg-slate-900 border-slate-800'}`}>
    {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">Mais Popular</span>}
    <div className="mb-8">
      <h4 className="text-white font-black text-2xl mb-2">{tier}</h4>
      <p className="text-slate-500 text-sm mb-6">{desc}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-slate-500 text-lg font-bold">$</span>
        <span className="text-5xl font-black text-white">{price}</span>
        <span className="text-slate-500 text-sm">/mês</span>
      </div>
    </div>
    <ul className="space-y-4 flex-1 mb-10">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
          <CheckCircle2 size={18} className="text-primary-500 shrink-0 mt-0.5" />
          {f}
        </li>
      ))}
      {disabledFeatures.map((f: string, i: number) => (
        <li key={i} className="flex items-start gap-3 text-sm text-slate-600 italic">
          <ChevronRight size={18} className="shrink-0 mt-0.5" />
          {f}
        </li>
      ))}
    </ul>
    <button onClick={onPricing} className={`w-full py-4 rounded-xl font-bold transition-all text-lg ${popular ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-900/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
      Selecionar Plano
    </button>
  </div>
);

const Testimonial = ({ quote, author }: any) => (
  <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
    <p className="text-slate-400 italic text-sm leading-relaxed">"{quote}"</p>
    <div className="flex items-center gap-3">
       <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-400 uppercase">{author[0]}</div>
       <span className="text-xs font-bold text-white">{author}</span>
    </div>
  </div>
);
