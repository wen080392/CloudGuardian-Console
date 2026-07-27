import React, { useMemo } from 'react';
import { FileCheck, AlertTriangle, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import { Vulnerability } from '../types';
import { getComplianceReport } from '../services/engine';

interface ComplianceProps {
  vulnerabilities: Vulnerability[];
}

export const Compliance: React.FC<ComplianceProps> = ({ vulnerabilities }) => {
  const reports = useMemo(() => getComplianceReport(vulnerabilities), [vulnerabilities]);

  const stats = useMemo(() => ({
    passed: reports.filter(r => r.status === 'PASS').length,
    failed: reports.filter(r => r.status === 'FAIL').length,
    total: reports.length
  }), [reports]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Compliance Frameworks</h2>
          <p className="text-slate-400 text-sm max-w-2xl">
              Mapeamento automatizado de riscos para controles SOC2 e ISO27001.
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center min-w-[100px]">
              <div className="text-xs font-black text-emerald-500">{stats.passed}</div>
              <div className="text-[8px] font-black text-slate-500 uppercase">Passed</div>
           </div>
           <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center min-w-[100px]">
              <div className="text-xs font-black text-red-500">{stats.failed}</div>
              <div className="text-[8px] font-black text-slate-500 uppercase">Failed</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <div key={report.id} className={`bg-slate-900/40 backdrop-blur-xl border rounded-3xl p-6 flex items-center justify-between transition-all hover:bg-slate-900/60 ${report.status === 'FAIL' ? 'border-red-500/20' : 'border-slate-800'}`}>
            <div className="flex items-start gap-5">
              <div className={`mt-1 p-3 rounded-2xl border shadow-lg ${
                report.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {report.status === 'PASS' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                      report.framework === 'SOC2' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                      'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                  }`}>{report.framework}</span>
                  <span className="text-[10px] font-mono text-slate-600">{report.id}</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">{report.title}</h3>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">{report.description || 'Controle de segurança auditável via CloudGuardian Engine.'}</p>
                
                {report.status === 'FAIL' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 rounded-lg border border-red-500/10 w-fit">
                        <Shield size={12} className="text-red-500" />
                        <span className="text-[10px] font-bold text-red-400 uppercase">Violação Ativa Detectada</span>
                    </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
               <div className="text-right">
                  <div className={`text-3xl font-black tracking-tighter ${report.score === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {report.score}%
                  </div>
                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Compliance Score</div>
               </div>
               {report.status === 'FAIL' && (
                 <button className="flex items-center gap-1 text-[10px] font-black text-primary-400 uppercase hover:text-primary-300 transition-colors">
                    Ver Evidência <ArrowRight size={10} />
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};