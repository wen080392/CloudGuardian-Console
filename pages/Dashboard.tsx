
import React, { useEffect, useState, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  ShieldAlert, Activity, Target, Globe, 
  Cpu, Zap, ShieldCheck, Wifi, Crosshair, Terminal
} from 'lucide-react';
import { motion, useMotionValue, animate } from 'motion/react';
import { SecurityScore, Vulnerability, DriftItem, TimelineEvent, Policy, PipelineRun } from '../types';
import { API } from '../services/backend';
import { SecurityScoreGauge } from '../components/SecurityScoreGauge';

interface DashboardProps {
  vulnerabilities: Vulnerability[];
  drifts: DriftItem[];
  score: SecurityScore;
  timeline: TimelineEvent[];
  onNavigate: (view: any) => void;
  policies: Policy[];
  runs: PipelineRun[];
}

const TRAFFIC_DATA = [
  { time: '00:00', inbound: 400, blocked: 20 }, { time: '04:00', inbound: 300, blocked: 10 },
  { time: '08:00', inbound: 1200, blocked: 80 }, { time: '12:00', inbound: 1800, blocked: 150 },
  { time: '16:00', inbound: 1600, blocked: 120 }, { time: '20:00', inbound: 900, blocked: 40 },
  { time: '23:59', inbound: 500, blocked: 30 },
];

export const Dashboard: React.FC<DashboardProps> = ({ 
  vulnerabilities, score, onNavigate
}) => {
  const [systemHealth, setSystemHealth] = useState<any[]>([]);
  const [attacks, setAttacks] = useState<any[]>([]);
  const [, setLoading] = useState(false);

  useEffect(() => {
    loadLiveFeeds();
    const interval = setInterval(loadLiveFeeds, 3000); 
    return () => clearInterval(interval);
  }, []);

  const loadLiveFeeds = async () => {
    setLoading(true);
    const [newAttacks, health] = await Promise.all([
      API.getLiveAttacks(),
      API.getSystemIntegrity()
    ]);
    
    setAttacks(prev => {
        const unique = [...newAttacks, ...prev].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
        return unique.slice(0, 8); 
    });
    setSystemHealth(health);
    setLoading(false);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
             <ClockIcon />
             <p className="text-[10px] font-mono text-slate-400">{label}</p>
          </div>
          <div className="space-y-1 font-mono">
             <div className="flex items-center gap-3 text-xs text-primary-400">
                <span className="w-1 h-1 bg-primary-500 rounded-full animate-pulse"></span>
                Traffic: <span className="font-bold text-white">{payload[0].value} MB/s</span>
             </div>
             <div className="flex items-center gap-3 text-xs text-red-400">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                Threats: <span className="font-bold text-white">{payload[1].value}</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-[1800px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
      
      {/* HEADER HUD */}
      <motion.header 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-1"
      >
        <div className="space-y-1 relative pl-4 border-l-2 border-primary-500">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-500">Center</span>
          </h2>
          <div className="flex items-center gap-3">
             <div className="flex gap-1">
                <span className="w-1 h-3 bg-emerald-500 rounded-sm animate-pulse"></span>
                <span className="w-1 h-3 bg-emerald-500/50 rounded-sm"></span>
                <span className="w-1 h-3 bg-emerald-500/20 rounded-sm"></span>
             </div>
             <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">System Operational :: Level 1</span>
          </div>
        </div>
        
        <div className="flex gap-4">
           <HudMetric label="Risk Score" value={score.total} color={score.total > 80 ? 'text-emerald-400' : 'text-amber-400'} icon={<ShieldCheck size={16}/>} delay={0.1} />
           <HudMetric label="Active Threats" value={vulnerabilities.length} color={vulnerabilities.length === 0 ? 'text-slate-400' : 'text-red-500'} icon={<Target size={16}/>} delay={0.2} />
        </div>
      </motion.header>

      {/* FEATURED SECURITY SCORE DISPLAY WITH ANIMATIONS */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <SecurityScoreGauge score={score} />
      </motion.div>

      {/* MAIN BATTLE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
        
        {/* CENTER: TACTICAL GLOBE (7 Cols) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 relative group"
        >
           <HudContainer className="h-full relative overflow-hidden bg-[#020617]">
              {/* Decorative Map Overlays */}
              <div className="absolute top-6 left-6 z-20 flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-primary-500">
                    <Crosshair size={16} className="animate-[spin_10s_linear_infinite]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Telemetry</span>
                 </div>
                 <span className="text-[9px] font-mono text-slate-600">LIVE FEED • ENCRYPTED</span>
              </div>

              {/* Rotating Rings Background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full z-0 pointer-events-none animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-dashed border-white/5 rounded-full z-0 pointer-events-none animate-[spin_40s_linear_infinite_reverse]"></div>

              <div className="flex-1 w-full h-full relative z-10">
                 <HolographicGlobe />
              </div>

              {/* Bottom Metrics Overlay */}
              <div className="absolute bottom-6 right-6 z-20 flex gap-4">
                 <div className="bg-slate-950/80 backdrop-blur border border-white/10 px-4 py-2 rounded flex items-center gap-3">
                    <Activity size={14} className="text-emerald-500" />
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Network Latency</span>
                        <span className="text-xs font-mono text-white">24ms <span className="text-emerald-500">▼</span></span>
                    </div>
                 </div>
              </div>
           </HudContainer>
        </motion.div>

        {/* RIGHT: INTEL & ACTIONS (5 Cols) */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex flex-col gap-6 h-full"
        >
           
           {/* SYSTEM MODULES (Grid) */}
           <div className="grid grid-cols-2 gap-3 shrink-0">
              {systemHealth.map(sys => (
                 <div key={sys.id} className="bg-slate-900/80 border border-white/5 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-all">
                    <div className={`absolute top-0 right-0 p-3 opacity-20 ${sys.status === 'optimal' ? 'text-emerald-500' : 'text-amber-500'}`}>
                       <Cpu size={24} />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{sys.name}</span>
                       <div className={`w-1.5 h-1.5 rounded-full ${sys.status === 'optimal' ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></div>
                    </div>
                    <div className="flex items-end gap-1">
                       <span className="text-xl font-mono text-white font-bold">{sys.load}%</span>
                       <span className="text-[9px] text-slate-600 mb-1">LOAD</span>
                    </div>
                    {/* Mini Bar */}
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                       <div className={`h-full ${sys.status === 'optimal' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${sys.load}%` }}></div>
                    </div>
                 </div>
              ))}
           </div>

           {/* ATTACK FEED */}
           <HudContainer className="flex-1 bg-slate-900/60 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={14} className="text-red-500 animate-pulse" /> Threat Detection Log
                 </h3>
                 <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-black uppercase border border-red-500/20">Live</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 relative">
                 <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-800"></div>
                 {attacks.map((atk) => (
                    <div key={atk.id} className="relative pl-5 py-2 group hover:bg-white/[0.02] transition-colors rounded-r-lg">
                       <div className={`absolute left-0 top-3 w-3 h-3 rounded-full border-2 border-slate-900 ${atk.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'} z-10 shadow-[0_0_8px_rgba(239,68,68,0.4)]`}></div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{atk.type}</span>
                          <span className="text-[9px] font-mono text-slate-600">{new Date(atk.timestamp).toLocaleTimeString([], {hour12: false})}</span>
                       </div>
                       <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] font-mono text-slate-500 truncate max-w-[120px]">{atk.origin} ➔ {atk.target}</span>
                          <span className="text-[8px] font-black text-red-500 border border-red-500/20 px-1.5 rounded bg-red-500/5">BLOCKED</span>
                       </div>
                    </div>
                 ))}
              </div>
           </HudContainer>

           {/* ACTIONS */}
           <div className="grid grid-cols-2 gap-4 h-24 shrink-0">
              <button onClick={() => onNavigate('war-room')} className="bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-500 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group">
                 <Target size={20} className="group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] font-black uppercase tracking-widest">War Room</span>
              </button>
              <button onClick={() => onNavigate('scanner')} className="bg-primary-900/20 hover:bg-primary-900/40 border border-primary-500/30 text-primary-400 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group">
                 <Zap size={20} className="group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Auto-Fix</span>
              </button>
           </div>

        </motion.div>
      </div>

      {/* BOTTOM: TRAFFIC CHART */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <HudContainer className="h-[200px] bg-slate-900/40 relative overflow-hidden group">
           <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
              <Wifi size={16} className="text-primary-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Network Traffic Analysis</span>
           </div>
           
           <div className="absolute inset-0 pt-10 pb-2 px-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={TRAFFIC_DATA}>
                    <defs>
                       <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                       </linearGradient>
                       <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                       </pattern>
                    </defs>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
                    
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#64748b', fontFamily: 'monospace'}} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#64748b', fontFamily: 'monospace'}} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }} />
                    
                    <Area 
                      type="monotone" 
                      dataKey="inbound" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorInbound)" 
                      activeDot={{ r: 6, fill: '#0f172a', stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="blocked" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorBlocked)" 
                      activeDot={{ r: 6, fill: '#0f172a', stroke: '#ef4444', strokeWidth: 2 }}
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </HudContainer>
      </motion.div>

    </div>
  );
};

// --- Tactical Components ---

const HudMetric = ({ label, value, color, icon, delay = 0 }: any) => {
  const count = useMotionValue(0);
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    if (typeof value === 'number') {
      const controls = animate(count, value, {
        duration: 1.2,
        delay,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (latest) => setDisplayVal(Math.round(latest))
      });
      return () => controls.stop();
    }
  }, [value, count, delay]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-slate-900/80 border border-white/10 px-5 py-3 rounded-xl flex items-center gap-4 relative overflow-hidden group shadow-lg"
    >
       <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30"></div>
       <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30"></div>
       
       <div className={`p-2 rounded bg-slate-950 border border-white/5 ${color} shadow-lg`}>
          {icon}
       </div>
       <div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</div>
          <div className={`text-2xl font-black ${color} tracking-tight leading-none font-mono`}>
             {typeof value === 'number' ? displayVal : value}
          </div>
       </div>
    </motion.div>
  );
};

const HudContainer = ({ children, className }: any) => (
  <div className={`rounded-xl border border-white/10 relative p-6 shadow-2xl ${className}`}>
     <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
        <path d="M 20 0 L 0 0 L 0 20" fill="none" stroke="currentColor" className="text-white" strokeWidth="2" />
        <path d="M 0 calc(100% - 20px) L 0 100% L 20 100%" fill="none" stroke="currentColor" className="text-white" strokeWidth="2" />
        <path d="M calc(100% - 20px) 100% L 100% 100% L 100% calc(100% - 20px)" fill="none" stroke="currentColor" className="text-white" strokeWidth="2" />
        <path d="M 100% 20 L 100% 0 L calc(100% - 20px) 0" fill="none" stroke="currentColor" className="text-white" strokeWidth="2" />
     </svg>
     {children}
  </div>
);

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

// --- Optimized Globe Component ---
const HolographicGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      requestAnimationFrame(() => {
        if (!container || !canvas || !ctx) return;
        width = container.offsetWidth;
        height = container.offsetHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const GLOBE_RADIUS = 220; 
    const DOT_COUNT = 500;
    let angle = 0;
    const dots: {x: number, y: number, z: number}[] = [];

    const phi = Math.PI * (3 - Math.sqrt(5)); 
    for (let i = 0; i < DOT_COUNT; i++) {
        const y = 1 - (i / (DOT_COUNT - 1)) * 2; 
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        dots.push({ x: x * GLOBE_RADIUS, y: y * GLOBE_RADIUS, z: z * GLOBE_RADIUS });
    }

    const render = () => {
        ctx.clearRect(0, 0, width, height);
        const cx = width / 2;
        const cy = height / 2;
        angle += 0.002; 

        // Background Ring
        ctx.beginPath();
        ctx.arc(cx, cy, GLOBE_RADIUS + 40, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
        ctx.stroke();

        const projectedDots = dots.map(dot => {
            const x = dot.x * Math.cos(angle) - dot.z * Math.sin(angle);
            const z = dot.z * Math.cos(angle) + dot.x * Math.sin(angle);
            const y = dot.y;
            const scale = 400 / (400 + z);
            const alpha = Math.max(0.1, (scale - 0.4) * 2); 
            return { x: cx + x * scale, y: cy + y * scale, z, alpha, scale };
        });

        // Connections
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)'; 
        ctx.lineWidth = 0.5;
        for (let i = 0; i < projectedDots.length; i++) {
            const p1 = projectedDots[i];
            if (p1.z < 0) continue; 
            for (let j = i + 1; j < Math.min(i + 8, projectedDots.length); j++) {
                const p2 = projectedDots[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = dx*dx + dy*dy;
                if (dist < 1800) {
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                }
            }
        }
        ctx.stroke();

        projectedDots.forEach(p => {
            const isBack = p.z < 0;
            ctx.beginPath();
            const size = isBack ? 0.8 : Math.max(1, p.scale * 2);
            ctx.fillStyle = isBack ? `rgba(100, 116, 139, 0.3)` : `rgba(59, 130, 246, ${p.alpha})`; 
            
            if (Math.random() > 0.997 && !isBack) {
               ctx.fillStyle = '#ef4444';
               ctx.shadowBlur = 8;
               ctx.shadowColor = '#ef4444';
            } else {
               ctx.shadowBlur = 0;
            }

            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        });

        animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
        observer.disconnect();
        cancelAnimationFrame(animationId);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full"><canvas ref={canvasRef} className="w-full h-full block" /></div>;
};
