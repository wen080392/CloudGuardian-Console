
import React, { useState } from 'react';
import {
  Shield, GitPullRequest, Clock, FileCheck, ArrowRight, Zap,
  Lock, AlertCircle, CheckCircle2, Globe, Users, TrendingUp,
  ChevronRight, Award, BarChart3, Rocket, Loader2, Download, ScanLine
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
            <button onClick={() => scrollToSection('auditoria')} className="hover:text-white transition-colors">Auditoria Grátis</button>
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
              onClick={() => scrollToSection('auditoria')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 text-lg"
            >
              <ScanLine size={20} className="text-primary-400" />
              Auditoria grátis em 5 min
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

      {/* Instant Audit (PLG) */}
      <InstantAuditSection />

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

interface AuditFinding {
  ruleId: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  resource: string;
  remediation: string;
}
interface AuditResult {
  score: number;
  engine: string;
  summary: { critical: number; high: number; medium: number; low: number; total: number };
  topFindings: AuditFinding[];
  reportUrl: string;
}

const SAMPLE_TF = `resource "aws_s3_bucket" "assets" {
  bucket = "my-company-assets"
  acl    = "public-read"
}

resource "aws_security_group" "web" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  engine              = "postgres"
  publicly_accessible = true
}`;

const SEV_STYLE: Record<string, { text: string; bg: string; ring: string; label: string }> = {
  critical: { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', ring: 'stroke-red-500', label: 'Crítico' },
  high: { text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', ring: 'stroke-orange-500', label: 'Alto' },
  medium: { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', ring: 'stroke-amber-500', label: 'Médio' },
  low: { text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', ring: 'stroke-blue-500', label: 'Baixo' },
};

const scoreColor = (score: number) =>
  score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

const InstantAuditSection = () => {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [terraform, setTerraform] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  const runAudit = async () => {
    setError(null);
    setResult(null);
    if (!email || !terraform.trim()) {
      setError('Informe seu email e cole o código Terraform.');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch('/api/v1/audit/instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company: company || undefined, terraform }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'Falha ao executar a auditoria.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="auditoria" className="py-24 px-6 bg-slate-900/20 border-y border-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-[10px] font-black uppercase tracking-widest">
            <ScanLine size={12} />
            Auditoria de 5 minutos
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Cole seu Terraform. Veja seus riscos agora.</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Sem instalar nada, sem cartão de crédito. Rodamos nosso motor de análise no seu código e geramos um relatório executivo em PDF.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Input */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:border-primary-500 focus:outline-none"
              />
              <input
                type="text" value={company} onChange={e => setCompany(e.target.value)}
                placeholder="Empresa (opcional)"
                className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <textarea
                value={terraform} onChange={e => setTerraform(e.target.value)}
                placeholder="Cole aqui seu código Terraform (.tf)…"
                rows={12}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 placeholder-slate-600 focus:border-primary-500 focus:outline-none resize-none"
              />
              <button
                onClick={() => setTerraform(SAMPLE_TF)}
                className="absolute top-2 right-2 text-[10px] font-bold text-slate-500 hover:text-primary-400 bg-slate-950/80 px-2 py-1 rounded uppercase tracking-wider"
              >
                Usar exemplo
              </button>
            </div>
            <button
              onClick={runAudit} disabled={loading}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-xl shadow-primary-900/40 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Analisando…</> : <><ScanLine size={20} /> Rodar auditoria grátis</>}
            </button>
            {error && <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16} /> {error}</p>}
            <p className="text-[10px] text-slate-600 text-center">Analisamos apenas o código enviado. Nada é executado.</p>
          </div>

          {/* Result */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 min-h-[360px] flex items-center justify-center">
            {!result ? (
              <div className="text-center text-slate-600 space-y-3">
                <Shield size={48} className="mx-auto opacity-30" />
                <p className="text-sm">Seu relatório de riscos aparece aqui.</p>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <div className="flex items-center gap-6">
                  <ScoreRing score={result.score} />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
                      <div key={sev} className={`px-3 py-2 rounded-xl border ${SEV_STYLE[sev].bg}`}>
                        <div className={`text-lg font-black ${SEV_STYLE[sev].text}`}>{result.summary[sev]}</div>
                        <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">{SEV_STYLE[sev].label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {result.topFindings.length === 0 ? (
                    <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16} /> Nenhum risco detectado no código enviado.</p>
                  ) : result.topFindings.map((f, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${SEV_STYLE[f.severity].bg}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200">{f.title}</span>
                        <span className={`text-[9px] font-black uppercase ${SEV_STYLE[f.severity].text}`}>{f.ruleId}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">{f.resource}</p>
                    </div>
                  ))}
                </div>

                <a
                  href={result.reportUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={18} /> Baixar relatório executivo (PDF)
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const ScoreRing = ({ score }: { score: number }) => {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="shrink-0">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={r} fill="none" stroke={scoreColor(score)} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 55 55)"
      />
      <text x="55" y="52" textAnchor="middle" fontSize="26" fontWeight="bold" fill="white">{score}</text>
      <text x="55" y="70" textAnchor="middle" fontSize="9" fill="#64748b" className="uppercase font-bold">Score</text>
    </svg>
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
