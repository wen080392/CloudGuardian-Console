
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Search, Filter, Globe, Database, Cpu, Shield, 
  AlertTriangle, Loader2, Sparkles, ArrowUpRight, 
  Trash2, Layers, DollarSign, Cloud, ChevronRight, Zap, Users
} from 'lucide-react';
import { Asset, Severity } from '../types';
import { API } from '../services/backend';

export const Inventory: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [insights, setInsights] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await API.getAssets();
    setAssets(data);
    setLoading(false);
    
    setLoadingInsights(true);
    const aiInsights = await API.generateAssetInsights(data);
    setInsights(aiInsights);
    setLoadingInsights(false);
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

  const stats = useMemo(() => {
    const totalCost = assets.reduce((acc, curr) => acc + curr.cost, 0);
    const avgRisk = assets.reduce((acc, curr) => acc + curr.riskScore, 0) / (assets.length || 1);
    return { totalCost, avgRisk, count: assets.length };
  }, [assets]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Box size={12} className="text-primary-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cloud Asset Registry v2.0</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
            Asset <span className="text-primary-500">Inventory</span>
          </h2>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Localizar recurso (AWS_ID, Tag...)"
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-primary-500 transition-all shadow-inner"
            />
          </div>
          <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
            <Filter size={20} />
          </button>
        </div>
      </header>

      {/* Heatmap Grid Section */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <StatTile label="Total Cloud Assets" value={stats.count} icon={<Layers size={20} className="text-primary-400" />} />
        <StatTile label="Monthly Cloud Spend" value={`$${stats.totalCost.toFixed(2)}`} icon={<DollarSign size={20} className="text-emerald-400" />} />
        <StatTile label="Fleet Risk Index" value={Math.round(stats.avgRisk)} icon={<AlertTriangle size={20} className="text-amber-400" />} />
        <StatTile label="Active Regions" value="3" icon={<Globe size={20} className="text-indigo-400" />} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Asset Table */}
        <div className="lg:col-span-8 space-y-6">
           <div className="neo-card rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>
              
              <div className="bg-slate-900/60 px-8 py-5 border-b border-white/5 flex justify-between items-center">
                 <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} className="text-primary-500" /> Managed Resources
                 </h3>
                 <span className="text-[9px] text-slate-500 font-bold uppercase">{filteredAssets.length} Results</span>
              </div>
              
              <div className="overflow-x-auto bg-slate-950/20 backdrop-blur-sm">
                <table className="w-full text-left">
                  <thead className="border-b border-white/5">
                    <tr>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Resource & Provider</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Category</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Risk</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                       <tr>
                         <td colSpan={4} className="py-20 text-center">
                            <Loader2 className="animate-spin text-primary-500 mx-auto" size={32} />
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-4">Sincronizando Provedores...</p>
                         </td>
                       </tr>
                    ) : (
                      filteredAssets.map(asset => (
                        <tr key={asset.id} className="group hover:bg-primary-500/5 transition-colors cursor-pointer relative overflow-hidden">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                               <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5 text-primary-400 group-hover:scale-110 transition-transform group-hover:border-primary-500/30 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                  {getCategoryIcon(asset.category)}
                               </div>
                               <div>
                                  <div className="text-xs font-black text-white group-hover:text-primary-300 transition-colors">{asset.name}</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">{asset.provider}</span>
                                    <span className="text-slate-700">•</span>
                                    <span className="text-[9px] text-slate-600 font-mono">{asset.type}</span>
                                  </div>
                                </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">{asset.category}</span>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                                   <div className={`h-full ${asset.riskScore > 70 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : asset.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`} style={{ width: `${asset.riskScore}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-white">{asset.riskScore}%</span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="text-xs font-black text-white tracking-tight">${asset.cost.toFixed(2)}</div>
                             <div className="text-[8px] text-slate-600 font-black uppercase">Monthly Est.</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <section className="neo-card rounded-[40px] p-8 space-y-8 bg-gradient-to-br from-primary-950/20 to-slate-950/20 border border-primary-500/20 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Sparkles size={80} className="text-primary-400 animate-pulse" />
              </div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 relative z-10">
                 <Zap size={18} className="text-amber-500" /> AI Asset Advisor
              </h3>
              
              <div className="space-y-6 relative z-10">
                 {loadingInsights ? (
                    Array.from({ length: 3 }).map((_, i) => (
                       <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse"></div>
                    ))
                 ) : (
                    insights.map((insight, i) => (
                       <div key={i} className="p-5 bg-black/40 border border-white/5 rounded-3xl hover:border-primary-500/30 transition-all group/insight">
                          <div className="flex justify-between items-start mb-2">
                             <span className="text-[9px] font-black text-primary-400 uppercase tracking-widest">{insight.impact}</span>
                             <ArrowUpRight size={14} className="text-slate-600 group-hover/insight:text-white transition-colors" />
                          </div>
                          <h4 className="text-xs font-bold text-white mb-2 leading-tight uppercase italic">{insight.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed italic">{insight.recommendation}</p>
                       </div>
                    ))
                 )}
              </div>

              <button className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/40 relative z-10">
                 Optimize Entire Fleet
              </button>
           </section>

           <section className="bg-slate-900/60 border border-white/5 rounded-[40px] p-8 space-y-6 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 p-8 opacity-5">
                 <Cloud size={100} />
              </div>
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Global Heatmap Tags</h3>
              <div className="flex flex-wrap gap-2 relative z-10">
                 <TagLabel label="env:prod" count={12} />
                 <TagLabel label="data:pci" count={4} />
                 <TagLabel label="owner:sec-ops" count={8} />
                 <TagLabel label="region:us-east" count={22} />
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, icon }: any) => (
  <div className="neo-card p-6 rounded-[32px] border border-white/5 flex flex-col justify-between h-32 group hover:border-primary-500/20 transition-all bg-slate-900/40">
    <div className="flex justify-between items-center">
      <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5 shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all">
        {icon}
      </div>
      <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Live SDK</div>
    </div>
    <div>
      <div className="text-2xl font-black text-white italic tracking-tighter">{value}</div>
      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  </div>
);

const TagLabel = ({ label, count }: any) => (
  <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer hover:text-white hover:border-primary-500/30">
     {label} <span className="text-primary-500">{count}</span>
  </div>
);

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'compute': return <Cpu size={18} />;
    case 'storage': return <Database size={18} />;
    case 'network': return <Globe size={18} />;
    case 'security': return <Shield size={18} />;
    case 'identity': return <Users size={18} />;
    default: return <Box size={18} />;
  }
};
