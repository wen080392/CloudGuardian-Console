
import React, { useMemo, useState, useEffect } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Zap, BarChart3, ArrowRight, PieChart, Target, Calendar, Calculator, Cloud, Layers } from 'lucide-react';
import { Vulnerability } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Line, PieChart as RePie, Pie } from 'recharts';
import { API } from '../services/backend';

interface FinOpsProps {
  vulnerabilities: Vulnerability[];
}

const COST_DATA = [
  { month: 'Jan', legacy: 450, optimized: 29 },
  { month: 'Feb', legacy: 520, optimized: 29 },
  { month: 'Mar', legacy: 680, optimized: 35 },
  { month: 'Apr', legacy: 890, optimized: 42 }, 
  { month: 'May', legacy: 1200, optimized: 45 },
  { month: 'Jun', legacy: 1450, optimized: 48 }, 
];

const SERVICE_SPEND = [
  { name: 'Compute', value: 45, color: '#3b82f6' },
  { name: 'Database', value: 30, color: '#8b5cf6' },
  { name: 'Storage', value: 15, color: '#eab308' },
  { name: 'Network', value: 10, color: '#ef4444' },
];

export const FinOps: React.FC<FinOpsProps> = ({ vulnerabilities }) => {
  const [quotas, setQuotas] = useState<any>(null);
  const finopsFindings = useMemo(() => vulnerabilities.filter(v => v.type === 'finops'), [vulnerabilities]);
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    API.getQuotaUsage().then(setQuotas);
  }, []);

  const zeroCostSavings = useMemo(() => {
    if (!quotas) return 0;
    const dbSavings = quotas.database.used > 0 ? 15 : 0;
    const authSavings = quotas.auth.used * 0.05;
    const computeSavings = quotas.compute.used > 0 ? 25 : 0;
    return Math.round(dbSavings + authSavings + computeSavings);
  }, [quotas]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur border border-white/10 p-4 rounded-xl shadow-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{label} Projection</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
               <span className="text-xs font-bold text-white capitalize">{p.name}:</span>
               <span className="text-xs font-mono text-white">${p.value}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-white/10">
             <span className="text-[10px] text-emerald-400 font-black uppercase">Savings: ${payload[0].value - payload[1].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
      <header className="flex justify-between items-end border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <DollarSign size={14} className="text-emerald-500" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cost Intelligence</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
            FinOps <span className="text-emerald-500">Forecaster</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-xl font-medium">
            Análise preditiva de custos de nuvem e validação de economia da arquitetura Zero-Cost.
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-right">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Projected Legacy Spend</div>
              <div className="text-2xl font-black text-slate-400 line-through decoration-red-500 decoration-2">$1,450</div>
           </div>
           <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-right min-w-[160px] shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Optimized Spend</div>
              <div className="text-2xl font-black text-white italic">$48.00<span className="text-xs text-emerald-500 ml-1">/mo</span></div>
           </div>
        </div>
      </header>

      {/* Savings Calculator Banner */}
      <section className="bg-gradient-to-r from-slate-900 to-primary-950/30 border border-white/10 rounded-[32px] p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
         <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-all"></div>
         
         <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 text-primary-400">
               <Calculator size={18} />
               <span className="text-[10px] font-black uppercase tracking-widest">Architectural ROI</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic">Zero-Cost vs Legacy Cloud</h3>
            <p className="text-xs text-slate-400 max-w-lg">
               Sua arquitetura atual (Supabase, Clerk, Vercel) está economizando recursos significativos comparado a uma stack tradicional AWS (RDS, Cognito, EC2).
            </p>
         </div>
         
         <div className="flex gap-4 relative z-10">
            <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-default">
               <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Database</div>
               <div className="text-lg font-bold text-emerald-400">-$15.00</div>
            </div>
            <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-default">
               <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Identity</div>
               <div className="text-lg font-bold text-emerald-400">-${(quotas?.auth.used * 0.05).toFixed(0)}</div>
            </div>
            <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-default">
               <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Compute</div>
               <div className="text-lg font-bold text-emerald-400">-$25.00</div>
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Forecast Chart */}
        <div className="lg:col-span-2 neo-card rounded-[40px] p-8 border border-white/5 bg-slate-900/40 shadow-2xl relative overflow-hidden">
           <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                 <TrendingDown size={16} className="text-emerald-500" /> Cost Reduction Trajectory ("Gráfico Baixo")
              </h3>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-500"></div> Legacy Trend
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></div> Optimized
                 </div>
              </div>
           </div>
           
           <div className="h-[300px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={COST_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                       <linearGradient id="colorLegacy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="legacy" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorLegacy)" name="legacy" />
                    <Area type="monotone" dataKey="optimized" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOptimized)" name="optimized" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Top Spenders Pie Chart */}
        <div className="neo-card rounded-[40px] p-8 border border-white/5 bg-slate-900/40 shadow-xl flex flex-col relative overflow-hidden">
           <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none"></div>
           <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2 relative z-10">
              <PieChart size={16} className="text-indigo-500" /> Cost Distribution
           </h3>
           <div className="flex-1 min-h-[200px] relative z-10 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <RePie>
                  <Pie
                    data={SERVICE_SPEND}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                  >
                    {SERVICE_SPEND.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
                    ))}
                  </Pie>
                </RePie>
              </ResponsiveContainer>
              
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-2xl font-black text-white">$48</span>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total</span>
              </div>
           </div>
           
           <div className="mt-4 pt-4 border-t border-white/5 space-y-2 relative z-10">
              {SERVICE_SPEND.map((s, i) => (
                 <div key={s.name} className={`flex justify-between items-center text-xs transition-opacity duration-300 ${activeIndex === i ? 'opacity-100 scale-105' : 'opacity-60'}`}>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                       <span className="text-slate-300 font-medium">{s.name}</span>
                    </div>
                    <span className="text-white font-bold">${s.value}.00</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end">
           <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Optimization <span className="text-emerald-500">Opportunities</span></h3>
           <div className="flex gap-2">
              <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full text-slate-400 uppercase border border-white/5">Compute</span>
              <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full text-slate-400 uppercase border border-white/5">Database</span>
           </div>
        </div>

        {finopsFindings.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-slate-800 rounded-[32px] text-center opacity-40 hover:opacity-60 transition-opacity cursor-pointer">
                <Target size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Infrastructure is fully optimized.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {finopsFindings.map(f => (
                  <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Zap size={60} />
                      </div>
                      <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20 shadow-inner">
                                  <TrendingDown size={18} />
                              </div>
                              <div>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Anomaly Detected</span>
                                  <h4 className="text-sm font-bold text-white">{f.title}</h4>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="text-lg font-black text-emerald-500">-$120.00</div>
                              <div className="text-[8px] font-black text-slate-600 uppercase">Monthly Saving</div>
                          </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed relative z-10 mb-4 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                         {f.description}
                         <br/>
                         <span className="text-primary-400 font-mono mt-1 block text-[9px]">{f.resource}</span>
                      </p>
                      <button className="w-full py-3 bg-white/5 hover:bg-emerald-600 hover:text-white text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5 group-hover:border-transparent active:scale-95 shadow-lg">
                          Apply Optimization <ArrowRight size={12} />
                      </button>
                  </div>
               ))}
            </div>
        )}
      </div>
    </div>
  );
};
