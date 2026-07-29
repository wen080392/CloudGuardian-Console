
import React, { useState, useEffect, useRef } from 'react';
import { parseHclToGraph, calculateAttackPaths } from '../services/engine';
import { 
  Shield, Database, Globe, Layers, X, Cpu,
  Maximize2, ShieldAlert, Activity,
  ZoomIn, ZoomOut, Zap, Skull
} from 'lucide-react';
import { Vulnerability, GraphNode, GraphEdge, Severity } from '../types';

// Simple Force Graph Simulation Types
interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'compute': return '#a855f7'; // Purple
    case 'storage': return '#eab308'; // Yellow
    case 'network': return '#3b82f6'; // Blue
    case 'security': return '#10b981'; // Emerald
    default: return '#64748b'; // Slate
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'compute': return Cpu;
    case 'storage': return Database;
    case 'network': return Globe;
    case 'security': return Shield;
    default: return Layers;
  }
};

interface GraphProps {
  code: string;
  vulnerabilities: Vulnerability[];
  focusedResourceId?: string | null;
}

export const Graph: React.FC<GraphProps> = ({ code, vulnerabilities, focusedResourceId }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [attackPaths, setAttackPaths] = useState<{ id: string, name: string, path: string[], severity: Severity }[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'topology' | 'killchain'>('topology');
  
  // Viewport State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction Refs (Critical for smooth 60fps loop)
  const isDraggingCanvas = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const draggedNode = useRef<{ id: string; x: number; y: number } | null>(null);

  // Initialize Graph Data
  useEffect(() => {
    const { nodes: rawNodes, edges: rawEdges } = parseHclToGraph(code);
    
    // Enrich nodes with vulnerabilities and initial positions
    const simNodes: SimNode[] = rawNodes.map((n, i) => ({
      ...n,
      x: n.id === 'THE_INTERNET' ? 100 : Math.random() * 800 + 100, 
      y: n.id === 'THE_INTERNET' ? 300 : Math.random() * 600,
      vx: 0,
      vy: 0,
      status: vulnerabilities.some(v => (v.resource || '').includes(n.id)) ? 'risk' : 'healthy'
    }));

    setNodes(simNodes);
    setEdges(rawEdges);
    
    // Calculate Attack Paths
    const paths = calculateAttackPaths(rawNodes, rawEdges);
    setAttackPaths(paths);
    
    // Center view initially
    setPan({ x: window.innerWidth / 6, y: window.innerHeight / 8 });
  }, [code, vulnerabilities]);

  // Physics Engine
  useEffect(() => {
    let animationFrameId: number;
    
    const tick = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(n => ({ ...n })); // Shallow copy
        
        // Constants
        const REPULSION = 6000;
        const SPRING = 0.02;
        const SPRING_LENGTH = 200;
        const DAMPING = 0.90; // Higher damping for 'floaty' space feel
        const CENTER_GRAVITY = 0.002; 

        // 1. Repulsion (Nodes push apart)
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const n1 = newNodes[i];
            const n2 = newNodes[j];
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const distSq = dx * dx + dy * dy || 1;
            const force = REPULSION / distSq;
            const angle = Math.atan2(dy, dx);
            
            const fx = Math.cos(angle) * force;
            const fy = Math.sin(angle) * force;

            n1.vx += fx;
            n1.vy += fy;
            n2.vx -= fx;
            n2.vy -= fy;
          }
        }

        // 2. Spring (Edges pull together)
        edges.forEach(edge => {
          const source = newNodes.find(n => n.id === edge.source);
          const target = newNodes.find(n => n.id === edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = (dist - SPRING_LENGTH) * SPRING;
            const angle = Math.atan2(dy, dx);
            
            const fx = Math.cos(angle) * force;
            const fy = Math.sin(angle) * force;

            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        // 3. Update Positions & Apply Damping
        newNodes.forEach(n => {
          // If node is being dragged, lock it to mouse position ref
          if (draggedNode.current && n.id === draggedNode.current.id) {
             n.x = draggedNode.current.x;
             n.y = draggedNode.current.y;
             n.vx = 0;
             n.vy = 0;
          } else {
             // Internet Node is fixed anchor
             if (n.id === 'THE_INTERNET') {
                 n.vx = 0; n.vy = 0;
                 n.x = 100; n.y = 300;
             } else {
                 n.vx += (400 - n.x) * CENTER_GRAVITY;
                 n.vy += (300 - n.y) * CENTER_GRAVITY;
                 n.vx *= DAMPING;
                 n.vy *= DAMPING;
                 n.x += n.vx;
                 n.y += n.vy;
             }
          }
        });

        return newNodes;
      });
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [edges]); 

  // --- Global Mouse Up Listener ---
  useEffect(() => {
    const handleWindowMouseUp = () => {
        draggedNode.current = null;
        isDraggingCanvas.current = false;
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, []);

  // Canvas Interactions
  const handleWheel = (e: React.WheelEvent) => {
    const newZoom = Math.min(Math.max(zoom - e.deltaY * 0.001, 0.2), 3);
    setZoom(newZoom);
  };

  const getGraphCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const nodeElement = (e.target as Element).closest('[data-node-id]');
    if (nodeElement) {
      e.stopPropagation();
      const nodeId = nodeElement.getAttribute('data-node-id');
      if (nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          const coords = getGraphCoordinates(e.clientX, e.clientY);
          draggedNode.current = { id: nodeId, x: node.x, y: node.y }; 
          setSelectedNodeId(nodeId);
        }
      }
    } else {
      isDraggingCanvas.current = true;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode.current) {
      const coords = getGraphCoordinates(e.clientX, e.clientY);
      draggedNode.current.x = coords.x;
      draggedNode.current.y = coords.y;
    } else if (isDraggingCanvas.current) {
      setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  };

  // Logic Helpers
  const selectedPath = attackPaths.find(p => p.id === selectedPathId);
  const isNodeInPath = (id: string) => selectedPath?.path.includes(id) ?? false;
  const isEdgeInPath = (source: string, target: string) => {
      if (!selectedPath) return false;
      const srcIdx = selectedPath.path.indexOf(source);
      const tgtIdx = selectedPath.path.indexOf(target);
      return srcIdx !== -1 && tgtIdx !== -1 && Math.abs(srcIdx - tgtIdx) === 1;
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNodeId);
  const selectedNodeVulns = vulnerabilities.filter(v => selectedNodeData && (v.resource || '').includes(selectedNodeData.id));

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col p-6 overflow-hidden relative">
      
      {/* Attack Path Sidebar */}
      {viewMode === 'killchain' && (
        <div className="absolute left-6 top-6 bottom-6 w-80 bg-slate-900/90 backdrop-blur-xl border border-red-500/20 rounded-[32px] p-6 shadow-2xl z-40 animate-in slide-in-from-left duration-500 overflow-hidden flex flex-col">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                 <Skull size={20} className="text-red-500" /> Kill Chain
              </h3>
              <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] font-black text-red-500 uppercase">
                 {attackPaths.length} Vectors
              </div>
           </div>
           
           <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              {attackPaths.map(path => (
                 <div 
                   key={path.id}
                   onClick={() => setSelectedPathId(selectedPathId === path.id ? null : path.id)}
                   className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedPathId === path.id ? 'bg-red-900/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-slate-950 border-white/5 hover:border-red-500/30'}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{path.severity}</span>
                       <Zap size={12} className={selectedPathId === path.id ? "text-red-500 animate-pulse" : "text-slate-600"} />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-2">{path.name}</h4>
                    <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                       <span className="bg-slate-900 px-1.5 rounded">{path.path.length} Hops</span>
                       <span>→</span>
                       <span className="truncate max-w-[120px]">{path.path[path.path.length-1]}</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Main Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 bg-[#020617] rounded-[48px] border border-white/5 relative overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Header Overlay */}
        <div className={`absolute top-8 left-8 z-30 pointer-events-none transition-all duration-500 ${viewMode === 'killchain' ? 'translate-x-[340px]' : ''}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className={viewMode === 'killchain' ? "text-red-500 animate-pulse" : "text-primary-500"} size={14} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                 {viewMode === 'killchain' ? 'Active Attack Vectors' : 'Live Topology Engine'}
              </span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
              {viewMode === 'killchain' ? <span className="text-red-500">Attack Path</span> : 'Infra Universe'}
            </h2>
          </div>
        </div>

        {/* View Toggle */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 bg-slate-900/80 backdrop-blur-md border border-white/10 p-1 rounded-2xl flex gap-1">
           <button 
             onClick={() => setViewMode('topology')}
             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'topology' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-white'}`}
           >
              Topology
           </button>
           <button 
             onClick={() => setViewMode('killchain')}
             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'killchain' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-slate-500 hover:text-white'}`}
           >
              Kill Chain
           </button>
        </div>

        {/* Controls Overlay */}
        <div className="absolute top-8 right-8 z-30 flex gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-3 bg-slate-900/80 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white shadow-lg"><ZoomIn size={18}/></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.2))} className="p-3 bg-slate-900/80 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white shadow-lg"><ZoomOut size={18}/></button>
          <button onClick={() => { setZoom(1); setPan({x: window.innerWidth/4, y: window.innerHeight/6}); }} className="p-3 bg-slate-900/80 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white shadow-lg"><Maximize2 size={18}/></button>
        </div>

        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" 
             style={{ 
               backgroundImage: `linear-gradient(${viewMode === 'killchain' ? '#7f1d1d' : '#4f46e5'} 1px, transparent 1px), linear-gradient(90deg, ${viewMode === 'killchain' ? '#7f1d1d' : '#4f46e5'} 1px, transparent 1px)`, 
               backgroundSize: '50px 50px',
               transform: `scale(${zoom}) translate(${pan.x % 50}px, ${pan.y % 50}px)`
             }}>
        </div>

        <svg className="w-full h-full pointer-events-none">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {edges.map(edge => {
              const src = nodes.find(n => n.id === edge.source);
              const tgt = nodes.find(n => n.id === edge.target);
              if (!src || !tgt) return null;

              const inPath = selectedPathId ? isEdgeInPath(edge.source, edge.target) : false;
              // Dim unrelated if path selected or in killchain mode
              const dimmed = viewMode === 'killchain' && !inPath;
              
              const strokeColor = inPath ? '#ef4444' : (viewMode === 'killchain' ? '#334155' : '#1e293b');
              const strokeWidth = inPath ? 4 : 1;
              const opacity = dimmed ? 0.1 : (inPath ? 1 : 0.4);

              return (
                <g key={edge.id} className="transition-all duration-300">
                  <line 
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} 
                    stroke={strokeColor} 
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                  />
                  {inPath && (
                    <circle r="4" fill="#ef4444" filter="url(#glow)">
                      <animateMotion 
                        dur="1.5s" 
                        repeatCount="indefinite"
                        path={`M${src.x},${src.y} L${tgt.x},${tgt.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const inPath = selectedPathId ? isNodeInPath(node.id) : false;
              const isInternet = node.id === 'THE_INTERNET';
              
              const dimmed = viewMode === 'killchain' && !inPath && !isInternet;
              
              const color = inPath 
                ? '#ef4444' 
                : (node.status === 'risk' ? '#f59e0b' : getCategoryColor(node.data.category));
                
              const Icon = isInternet ? Globe : getCategoryIcon(node.data.category);

              return (
                <g 
                  key={node.id} 
                  data-node-id={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`pointer-events-auto cursor-pointer transition-all duration-300 ${dimmed ? 'opacity-20' : 'opacity-100'}`}
                >
                  {/* Hit Area */}
                  <circle r="30" fill="transparent" />

                  {/* Pulsing Effect for Internet or Path */}
                  {(isInternet || inPath) && (
                    <circle r="35" className="animate-ping opacity-20" fill={inPath ? '#ef4444' : '#3b82f6'} />
                  )}
                  
                  {/* Body */}
                  <circle 
                    r={isInternet ? 30 : 24} 
                    fill="#0f172a" 
                    stroke={isSelected ? '#fff' : color} 
                    strokeWidth={isSelected || inPath ? 3 : 2} 
                    className="transition-all" 
                  />
                  
                  {/* Icon */}
                  <foreignObject x={isInternet ? -15 : -12} y={isInternet ? -15 : -12} width={isInternet ? 30 : 24} height={isInternet ? 30 : 24} className="pointer-events-none">
                    <div className="flex items-center justify-center w-full h-full text-white">
                      <Icon size={isInternet ? 20 : 14} color={isSelected ? '#fff' : color} />
                    </div>
                  </foreignObject>

                  {/* Label */}
                  <text y={isInternet ? 50 : 40} textAnchor="middle" fill={inPath ? '#ef4444' : '#64748b'} fontSize={inPath ? "12" : "10"} fontWeight="bold" className="uppercase tracking-widest pointer-events-none select-none">
                    {node.data.label}
                  </text>
                </g>
              );
            })}
            
            <defs>
               <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                     <feMergeNode in="coloredBlur"/>
                     <feMergeNode in="SourceGraphic"/>
                  </feMerge>
               </filter>
            </defs>
          </g>
        </svg>

        {/* Selected Node Panel */}
        {selectedNodeData && (
          <div className="absolute top-24 right-8 w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-right-10 duration-300 z-30 pointer-events-auto">
             <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${selectedNodeData.status === 'risk' ? 'bg-red-500/10 text-red-500' : 'bg-primary-500/10 text-primary-500'}`}>
                   {React.createElement(getCategoryIcon(selectedNodeData.data.category), { size: 24 })}
                </div>
                <button onClick={() => setSelectedNodeId(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white"><X size={18}/></button>
             </div>
             
             <div className="space-y-4">
                <div>
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{selectedNodeData.data.label}</h3>
                   <span className="text-[10px] font-mono text-slate-500">{selectedNodeData.data.resource_type}</span>
                </div>

                {selectedNodeVulns.length > 0 ? (
                   <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                         <ShieldAlert size={12} /> Active Vulnerabilities
                      </h4>
                      {selectedNodeVulns.map(v => (
                         <div key={v.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-red-400 leading-tight">{v.title}</p>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                      <ShieldAlert size={16} />
                      <span className="text-[10px] font-black uppercase">Secure Resource</span>
                   </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
