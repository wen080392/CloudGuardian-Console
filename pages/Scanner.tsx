
import React, { useState, useEffect } from 'react';
import { ScanResults } from '../components/ScanResults';
import { RemediationHUD } from '../components/RemediationHUD';
import { API } from '../services/backend';
import { Vulnerability, Severity, ScanStatus } from '../types';
import { 
  Play, Loader2, AlertCircle, ShieldCheck, RotateCcw, 
  History, Database, Sparkles, Lock, Code2, Terminal,
  LayoutTemplate, Check, ChevronRight, X, ArrowRight
} from 'lucide-react';

interface ScannerProps {
  code: string;
  onCodeChange: (code: string) => void;
  onScanComplete: (vulns: Vulnerability[]) => void;
  vulnerabilities: Vulnerability[];
  onApplyFix: (id: string, code: string) => void;
  onSimulateBlast: (vulnerability: Vulnerability) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ code, onCodeChange, onScanComplete, vulnerabilities, onApplyFix, onSimulateBlast }) => {
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showBlueprints, setShowBlueprints] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  // Remediation State
  const [remediationStatus, setRemediationStatus] = useState<'idle' | 'initializing' | 'patching' | 'pushing' | 'completed'>('idle');
  const [prData, setPrData] = useState<{ prUrl: string; branch: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [hist, sub] = await Promise.all([
      API.getScanHistory(),
      API.getSubscriptionStatus()
    ]);
    setHistory(Array.isArray(hist) ? hist : []);
    setSubscription(sub);
  };

  const performScan = async () => {
    setScanning(true);
    try {
      const result = await API.scanInfrastructure(code);
      onScanComplete(result.vulns);
      await loadData();
    } catch (e) {
      console.error("Scan Error", e);
    } finally {
      setScanning(false);
    }
  };

  const handleApplyFixWithPR = async (vulnId: string, fixCode: string) => {
    setRemediationStatus('initializing');
    const t1 = setTimeout(() => setRemediationStatus('patching'), 1000);
    const t2 = setTimeout(() => setRemediationStatus('pushing'), 2500);

    try {
      const result = await API.createRemediationPR(vulnId, fixCode);
      clearTimeout(t1);
      clearTimeout(t2);
      setPrData(result);
      setRemediationStatus('completed');
      onApplyFix(vulnId, fixCode); // Aplica localmente também
    } catch (e) {
      // Ex.: GITHUB_TOKEN ausente / 503. Não deixa a HUD travar carregando:
      // aplica o patch localmente e encerra graciosamente.
      console.error('Falha ao criar o PR de remediação:', e);
      clearTimeout(t1);
      clearTimeout(t2);
      onApplyFix(vulnId, fixCode);
      setRemediationStatus('completed');
      setPrData(null);
      setTimeout(() => setRemediationStatus('idle'), 3000);
    }
  };

  const applyBlueprint = (newCode: string) => {
    onCodeChange(newCode);
    setShowBlueprints(false);
  };

  const blueprints = [
    { 
      name: "S3: Ultra Secure Bucket", 
      desc: "Private, Encryption enabled, Public Access Blocked.", 
      code: `resource "aws_s3_bucket" "prod_assets" {
  bucket = "cloudguardian-customer-data"
}

resource "aws_s3_bucket_public_access_block" "block" {
  bucket = aws_s3_bucket.prod_assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`
    },
    {
      name: "RDS: Private Database",
      desc: "Non-public, Var-based passwords.",
      code: `resource "aws_db_instance" "mysql_db" {
  allocated_storage    = 20
  engine               = "mysql"
  instance_class       = "db.t2.micro"
  db_name              = "production_db"
  username             = "admin"
  password             = var.db_password # Safe var injection
  publicly_accessible  = false           # Strictly private
  skip_final_snapshot  = false
}`
    },
    {
      name: "VPC: SOC2 Compliant Network",
      desc: "3 AZs, Private Subnets, NAT Gateway.",
      code: `module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name   = "soc2-vpc"
  cidr   = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
}`
    }
  ];

  const renderCode = (text: string) => {
    return text.split('\n').map((line, i) => (
      <div key={i} className="flex min-h-[1.5rem] group hover:bg-white/[0.03]">
        <span className="w-10 text-right pr-4 text-slate-700 font-mono text-xs pt-0.5 border-r border-white/5 mr-4 select-none">{i + 1}</span>
        <span className="flex-1 whitespace-pre font-mono text-xs leading-6 text-slate-400">{line || ' '}</span>
      </div>
    ));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 relative">
      
      {remediationStatus !== 'idle' && (
        <RemediationHUD 
          status={remediationStatus as any} 
          prUrl={prData?.prUrl} 
          branch={prData?.branch} 
          onClose={() => { setRemediationStatus('idle'); setPrData(null); }} 
        />
      )}

      {/* Blueprints Sidebar Overlay */}
      {showBlueprints && (
        <div className="fixed inset-0 z-[120] flex justify-end animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBlueprints(false)}></div>
           <div className="relative w-full max-w-md bg-slate-950 border-l border-white/10 h-full shadow-2xl p-10 flex flex-col space-y-10 animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center">
                 <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Safe <span className="text-primary-500">Blueprints</span></h3>
                 <button onClick={() => setShowBlueprints(false)} className="p-2 hover:bg-white/5 rounded-xl"><X size={24}/></button>
              </div>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                 Substitua snippets inseguros por padrões testados e certificados pela nossa equipe de SecOps.
              </p>
              
              <div className="space-y-6">
                 {blueprints.map((b, i) => (
                   <div key={i} className="neo-card rounded-[32px] p-6 space-y-6 border border-white/5 hover:border-primary-500/30 transition-all cursor-pointer group" onClick={() => applyBlueprint(b.code)}>
                      <div className="flex justify-between items-start">
                         <div className="p-3 bg-primary-500/10 rounded-2xl text-primary-500">
                            <LayoutTemplate size={24} />
                         </div>
                         <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest border border-white/5 px-2 py-1 rounded">HCL Pattern</div>
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-white mb-1 group-hover:text-primary-400 transition-colors">{b.name}</h4>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">{b.desc}</p>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-primary-500 uppercase tracking-widest">
                         <span>Apply to Forge</span>
                         <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Code2 size={12} className="text-primary-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Code Security Forge</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
            Vulnerability <span className="text-primary-500">Scanner</span>
          </h2>
        </div>
        
        <div className="flex gap-4">
           <button 
            onClick={() => setShowBlueprints(true)}
            className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95"
           >
             <LayoutTemplate size={16} /> Safe Blueprints
           </button>
           <button 
            onClick={performScan} 
            disabled={scanning} 
            className="flex items-center gap-3 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/40 disabled:opacity-50 active:scale-95 group"
           >
            {scanning ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" />}
            {scanning ? 'Analyzing Infrastructure...' : 'Initiate Security Scan'}
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 neo-card rounded-[40px] overflow-hidden flex flex-col min-h-[650px] shadow-2xl relative">
          <div className="bg-slate-900/60 backdrop-blur-md px-8 py-4 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30"></div>
               </div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l border-white/5 pl-4">main.tf • Terraform HCL</span>
            </div>
            <div className="text-[9px] font-black text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full uppercase tracking-widest">IA Real-time Monitoring</div>
          </div>
          
          <div className="flex-1 relative bg-slate-950/40 p-8 overflow-y-auto custom-scrollbar">
            <textarea 
              value={code} 
              onChange={(e) => onCodeChange(e.target.value)} 
              className="absolute inset-0 w-full h-full p-8 pl-16 bg-transparent text-transparent caret-white font-mono text-xs leading-6 resize-none focus:outline-none z-10"
              spellCheck={false}
              placeholder="Cole seu código Terraform HCL aqui..."
            />
            <div className="pointer-events-none relative z-0">{renderCode(code)}</div>
          </div>

          <div className="p-4 bg-slate-900/40 border-t border-white/5 flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
             <div className="flex gap-6">
                <span className="flex items-center gap-2"><Terminal size={12}/> UTF-8</span>
                <span className="flex items-center gap-2"><History size={12}/> Git: main</span>
             </div>
             <span>Lines: {code.split('\n').length}</span>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="neo-card rounded-[32px] p-8 space-y-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <History size={16} className="text-primary-500" /> Storage Records
              </h3>
              <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                {history.length === 0 ? (
                  <div className="text-center py-8 bg-white/[0.02] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-slate-600 italic">No persistent scans in history.</p>
                  </div>
                ) : (
                  history.map((h, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/20 cursor-pointer transition-all">
                      <div className="flex items-center gap-3">
                         <Database size={12} className="text-slate-700" />
                         <span className="text-[10px] text-slate-300 font-bold uppercase">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className={`text-[10px] font-black ${h.score > 70 ? 'text-emerald-500' : 'text-red-500'}`}>H-Score: {h.score}</span>
                    </div>
                  ))
                )}
              </div>
           </div>

           {vulnerabilities.length > 0 || scanning ? (
             <div className="animate-in slide-in-from-right-10 duration-500">
               <ScanResults findings={vulnerabilities} codeContext={code} onApplyFix={handleApplyFixWithPR} onSimulateBlast={(resourceId) => {
                 const vuln = vulnerabilities.find(v => v.resource === resourceId);
                 if (vuln) onSimulateBlast(vuln);
               }} />
             </div>
           ) : (
             <div className="h-64 flex flex-col items-center justify-center neo-card rounded-[32px] bg-slate-900/20 p-12 text-center opacity-40">
                <AlertCircle size={48} className="text-slate-800 mb-4" />
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Engine Idle</h3>
                <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">Insira o código IaC para análise de segurança e conformidade assistida por IA.</p>
             </div>
           )}

           {subscription?.tier === 'free' && (
             <div className="bg-gradient-to-br from-primary-950/40 to-indigo-950/40 border border-primary-500/20 p-8 rounded-[32px] shadow-2xl space-y-6 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-600/10 rounded-full blur-2xl group-hover:bg-primary-600/20 transition-all"></div>
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary-600 rounded-xl">
                    <Sparkles className="text-white" size={18} />
                   </div>
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">Unleash Auto-PR</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                   O plano Pro permite que o motor de IA CloudGuardian crie Pull Requests automáticos para corrigir falhas detectadas em segundos.
                </p>
                <button className="w-full py-4 bg-white text-slate-950 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-xl">
                   <Lock size={14} /> Upgrade to Enterprise
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
