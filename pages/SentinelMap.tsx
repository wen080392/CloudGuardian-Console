
import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, Globe, ShieldAlert, Zap, Loader2, Sparkles, 
  ArrowUpRight, AlertTriangle, Crosshair, Radar, 
  Activity, Database, Target, Skull, Ghost, ShieldCheck, X, Shield, Map
} from 'lucide-react';
import { ThreatData, Asset } from '../types';
import { API } from '../services/backend';

export const SentinelMap: React.FC = () => {
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState<ThreatData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [t, a] = await Promise.all([API.getGlobalThreats(), API.getAssets()]);
    setThreats(t);
    setAssets(a);
    setLoading(false);
  };

  const handleAnalyzeImpact = async () => {
    if (!selectedThreat) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
        const result = await API.analyzeThreatImpact(selectedThreat, assets);
        setAnalysisResult(result);
    } catch (e) {
        console.error("Analysis Error", e);
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32 relative">
      
      {/* Analysis Overlay HUD */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in">
           <div className="text-center space-y-8 p-12 rounded-[64px] border border-primary-500/30 bg-black/40 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="relative mx-auto w-32 h-32">
                 <div className="absolute inset-0 border-t-4 border-primary-500 rounded-full animate-spin"></div>
                 <div className="absolute inset-2 border-r-4 border-primary-400 rounded-full animate-spin [animation-direction:reverse]"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Radar className="text-primary-500 animate-pulse" size={48} />
                 </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Running Simulation</h3>
                <p className="text-xs text-primary-400 font-mono uppercase tracking-[0.2em] animate-pulse">
                   Correlating {assets.length} assets against threat vector {selectedThreat?.id}...
                </p>
              </div>
           </div>
        </div>
      )}

      {analysisResult && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95 duration-300">
           <div className="bg-[#0b1221] border border-white/10 w-full max-w-2xl rounded-[48px] shadow-[0_0_100px_rgba(239,68,68,0.2)] p-12 relative border-t-red-500 border-t-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none"></div>
              <button onClick={() => setAnalysisResult(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
              
              <div className="flex gap-6 items-start mb-10 relative z-10">
                 <div className="p-5 bg-red-500/10 rounded-[32px] text-red-500 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <Skull size={40} />
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Impact <span className="text-red-500">Critical</span></h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                       <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                       Active Threat Match
                    </p>
                 </div>
              </div>

              <div className="space-y-8 relative z-10">
                 <div className="bg-slate-950/80 border border-white/5 rounded-3xl p-6 space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed italic font-medium">"{analysisResult.recommendation}"</p>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compromised Assets</h4>
                    {analysisResult.resources.length === 0 ? (
                        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase">False Positive - No Assets Affected</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysisResult.resources.map((r: Asset) => (
                            <div key={r.id} className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20 flex items-center gap-4 hover:bg-red-500/10 transition-colors cursor-pointer group">
                                <Database size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
                                <div>
                                  <div className="text-[10px] font-black text-white uppercase tracking-tight">{r.name}</div>
                                  <div className="text-[8px] text-red-400 font-bold uppercase mt-0.5">{r.type}</div>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                 </div>

                 <button className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-red-900/40 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3">
                    <ShieldAlert size={20} /> Initialize Kill Switch
                 </button>
              </div>
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio size={12} className="text-primary-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Global Intelligence Sentinel v3.0</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
            Geo-Tactical <span className="text-primary-500">Map</span>
          </h2>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-slate-900 border border-white/5 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Feed: DEFCON 3</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[650px]">
        {/* Radar Visualization Area */}
        <div className="lg:col-span-8 neo-card rounded-[48px] overflow-hidden border border-white/5 relative bg-[#020617] flex items-center justify-center shadow-2xl group">
           <div className="absolute top-6 left-8 z-20 pointer-events-none">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Map size={14} className="text-primary-500" /> Projection: Equirectangular
              </h3>
           </div>
           
           <div className="absolute inset-0 z-10">
              <TacticalMap threats={threats} onSelectThreat={setSelectedThreat} />
           </div>

           <div className="absolute bottom-8 left-8 flex flex-col gap-4 z-20 pointer-events-none">
              <LegendItem color="bg-red-500 shadow-[0_0_10px_#ef4444]" label="Active Exploits" count={threats.filter(t => t.intensity > 80).length} />
              <LegendItem color="bg-primary-500 shadow-[0_0_10px_#3b82f6]" label="Botnet Activity" count={threats.filter(t => t.intensity <= 80).length} />
           </div>

           <div className="absolute top-8 right-8 text-right z-20 pointer-events-none">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Global Threat Index</div>
              <div className="text-4xl font-black text-white tracking-tighter uppercase italic text-glow">High Risk</div>
           </div>
        </div>

        {/* Intelligence Side Column */}
        <div className="lg:col-span-4 flex flex-col space-y-8 h-full overflow-hidden">
           <section className="bg-slate-900 border border-white/5 rounded-[40px] p-8 flex flex-col flex-1 overflow-hidden shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none"></div>
              <div className="flex justify-between items-center mb-6 relative z-10">
                 <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-primary-500" /> Intercepted Signals
                 </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 relative z-10">
                 {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                       <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>
                    ))
                 ) : (
                    threats.map(t => (
                       <div 
                         key={t.id} 
                         onClick={() => setSelectedThreat(t)}
                         className={`p-5 rounded-[24px] border transition-all cursor-pointer group hover:scale-[1.02] ${selectedThreat?.id === t.id ? 'bg-primary-500/10 border-primary-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-slate-950/80 border-white/5 hover:border-primary-500/30'}`}
                       >
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${t.intensity > 80 ? 'bg-red-500 animate-ping' : 'bg-primary-500'}`}></div>
                                <span className={`text-[10px] font-black uppercase italic ${t.intensity > 80 ? 'text-red-400' : 'text-primary-400'}`}>{t.type} Detected</span>
                             </div>
                             <span className="text-[9px] font-mono text-slate-500">{t.region.toUpperCase()}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                             Pattern match for <span className="text-white font-bold">{t.targets.join(', ')}</span> vulnerability.
                          </p>
                          {selectedThreat?.id === t.id && (
                             <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-[9px] font-black text-primary-400 uppercase tracking-widest animate-in fade-in">
                                <Target size={12} /> Target Acquired
                             </div>
                          )}
                       </div>
                    ))
                 )}
              </div>
           </section>

           {/* AI Context Card */}
           {selectedThreat ? (
             <section className="bg-gradient-to-br from-indigo-950 to-slate-950 border border-primary-500/30 rounded-[40px] p-8 space-y-6 animate-in slide-in-from-bottom-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/20 rounded-full blur-[50px] group-hover:bg-primary-500/30 transition-all"></div>
                
                <div className="space-y-3 relative z-10">
                   <h4 className="text-xs font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-400" /> Sentinel AI
                   </h4>
                   <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic border-l-2 border-primary-500/50 pl-3">
                      "Traffic spike from {selectedThreat.region} targeting <strong>{selectedThreat.targets[0]}</strong>. High probability of CVE-2024-XXXX exploitation attempt. Recommend immediate asset correlation."
                   </p>
                </div>
                <button 
                  onClick={handleAnalyzeImpact}
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-primary-900/40 flex items-center justify-center gap-2 disabled:opacity-50 relative z-10"
                >
                   {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Crosshair size={16} />}
                   {isAnalyzing ? 'Scanning Fleet...' : 'Correlate Impact'}
                </button>
             </section>
           ) : (
             <section className="bg-slate-950/40 border border-dashed border-white/10 rounded-[40px] p-10 flex flex-col items-center justify-center text-center opacity-40">
                <Target size={32} className="text-slate-700 mb-4" />
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Select Threat Vector</p>
             </section>
           )}
        </div>
      </div>

      {/* Global Impact Dashboard */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <ImpactTile label="Regional Assets" value={assets.filter(a => a.region === (selectedThreat?.region || 'us-east-1')).length} sub="At Risk Exposure" icon={<Database size={18}/>} />
         <ImpactTile label="Critical CVEs" value="02" sub="Zero-Day Matches" icon={<Skull size={18} className="text-red-500"/>} />
         <ImpactTile label="Auto-Blocks" value="1,204" sub="Last 24h" icon={<ShieldCheck size={18} className="text-emerald-500"/>} />
         <ImpactTile label="Global Defcon" value="3" sub="Elevated Status" icon={<Radio size={18} className="text-amber-500"/>} />
      </section>
    </div>
  );
};

const ImpactTile = ({ label, value, sub, icon }: any) => (
  <div className="neo-card p-6 rounded-[32px] border border-white/5 space-y-4 group hover:border-primary-500/20 transition-all bg-slate-900/40">
     <div className="flex justify-between items-start">
        <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 text-primary-400 group-hover:scale-110 transition-transform shadow-inner">
           {icon}
        </div>
        <div className="text-[10px] font-black text-white italic tracking-tighter">{value}</div>
     </div>
     <div>
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
        <div className="text-[8px] font-bold text-slate-700 uppercase mt-1 group-hover:text-primary-500 transition-colors">{sub}</div>
     </div>
  </div>
);

const LegendItem = ({ color, label, count }: any) => (
  <div className="flex items-center gap-3">
     <div className={`w-2 h-2 rounded-full ${color}`}></div>
     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label} ({count})</span>
  </div>
);

// --- TACTICAL MAP COMPONENT ---
const TacticalMap = ({ threats, onSelectThreat }: { threats: ThreatData[], onSelectThreat: (t: ThreatData) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Simulation State
    const particles: any[] = [];
    const arcs: any[] = [];
    
    // Simplified World Map Points (Dot Matrix approximation)
    const mapPoints: {x: number, y: number}[] = [];
    // Generate random points that loosely resemble continents (Visual abstraction)
    // North America
    for(let i=0; i<40; i++) mapPoints.push({x: 100 + Math.random()*150, y: 100 + Math.random()*100});
    // South America
    for(let i=0; i<30; i++) mapPoints.push({x: 180 + Math.random()*80, y: 280 + Math.random()*150});
    // Europe/Africa
    for(let i=0; i<60; i++) mapPoints.push({x: 380 + Math.random()*120, y: 120 + Math.random()*250});
    // Asia
    for(let i=0; i<50; i++) mapPoints.push({x: 550 + Math.random()*200, y: 120 + Math.random()*150});
    // Australia
    for(let i=0; i<15; i++) mapPoints.push({x: 700 + Math.random()*80, y: 350 + Math.random()*80});

    // Map threat regions to approx coordinates
    const getCoords = (region: string) => {
        if(region.includes('us')) return {x: 180, y: 150};
        if(region.includes('eu')) return {x: 420, y: 140};
        if(region.includes('sa')) return {x: 220, y: 350};
        if(region.includes('ap')) return {x: 650, y: 200};
        return {x: width/2, y: height/2};
    };

    // Initialize Arcs based on threats
    threats.forEach(t => {
        const start = getCoords(t.region);
        // Random target somewhere else
        const end = {x: start.x + (Math.random() > 0.5 ? 200 : -200), y: start.y + (Math.random() * 100 - 50)};
        
        arcs.push({
            start, end, 
            progress: Math.random(), 
            speed: 0.005 + (t.intensity / 5000), 
            color: t.intensity > 80 ? '#ef4444' : '#3b82f6',
            data: t
        });
    });

    const render = () => {
        ctx.clearRect(0, 0, width, height);

        // Draw Map Dots
        ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
        mapPoints.forEach(p => {
            // Simple scale to fit canvas
            const x = p.x * (width/800);
            const y = p.y * (height/500);
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Grid Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        // Longitude
        for(let i=0; i<width; i+=50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
        // Latitude
        for(let i=0; i<height; i+=50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

        // Draw Arcs & Projectiles
        arcs.forEach(arc => {
            arc.progress += arc.speed;
            if(arc.progress >= 1) {
                arc.progress = 0;
                // Spawn impact particle
                particles.push({
                    x: arc.end.x, y: arc.end.y, 
                    radius: 1, maxRadius: 20, 
                    color: arc.color, alpha: 1
                });
            }

            // Calculate current position on quadratic bezier
            // Control point is midway x, much higher y (to make an arc)
            const cp = {x: (arc.start.x + arc.end.x)/2, y: Math.min(arc.start.y, arc.end.y) - 100};
            
            const t = arc.progress;
            const x = (1-t)*(1-t)*arc.start.x + 2*(1-t)*t*cp.x + t*t*arc.end.x;
            const y = (1-t)*(1-t)*arc.start.y + 2*(1-t)*t*cp.y + t*t*arc.end.y;

            // Draw Trail
            ctx.beginPath();
            ctx.moveTo(arc.start.x, arc.start.y);
            ctx.quadraticCurveTo(cp.x, cp.y, x, y);
            ctx.strokeStyle = `rgba(${arc.color === '#ef4444' ? '239,68,68' : '59,130,246'}, 0.2)`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Head
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = arc.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = arc.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Update & Draw Particles (Explosions)
        for(let i=particles.length-1; i>=0; i--) {
            const p = particles[i];
            p.radius += 0.5;
            p.alpha -= 0.02;
            
            if(p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${p.color === '#ef4444' ? '239,68,68' : '59,130,246'}, ${p.alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [threats]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};
