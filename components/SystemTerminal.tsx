
import React, { useEffect, useRef, useState } from 'react';
import { X, Terminal, Minimize2, Maximize2, Activity, Wifi } from 'lucide-react';

interface SystemTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOG_MESSAGES = [
  "Initializing Gemini 3 Pro Reasoning Engine...",
  "Connecting to AWS us-east-1 provider...",
  "Fetching Terraform state from s3://terraform-state-prod...",
  "Analyzing IAM policies for excessive permissions...",
  "Drift detection: No changes found in vpc-main.",
  "Scanning for hardcoded secrets in var files...",
  "Compliance check: SOC2 CC6.1 - Validating Access Control...",
  "Optimization: Found 2 idle RDS instances.",
  "Network Sentinel: Monitoring ingress traffic on port 443...",
  "Encryption check: EBS volumes are encrypted (KMS).",
  "AI Insight: Pattern matching suggests routine maintenance.",
  "Syncing asset inventory with Azure Resource Manager...",
  "Latency check: 24ms to regional endpoint.",
  "Policy Engine: Enforcing tagging strategy 'cost-center'.",
];

export const SystemTerminal: React.FC<SystemTerminalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs(prev => [...prev.slice(-50), `[${timestamp}] ${msg}`]);
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className={`fixed z-[99] transition-all duration-300 ease-in-out shadow-2xl border border-slate-800 bg-[#020617]/95 backdrop-blur-md overflow-hidden flex flex-col ${isMinimized ? 'bottom-6 left-[280px] w-96 h-12 rounded-xl border-t-primary-500/50' : 'bottom-0 left-0 right-0 h-64 border-t-primary-500/50'}`}>
      
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 select-none cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Terminal size={12} className="text-primary-500" />
            <span className="font-bold">CLOUD_GUARDIAN_CLI</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-emerald-500">ONLINE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1 hover:text-white text-slate-500">
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 hover:text-red-500 text-slate-500">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {!isMinimized && (
        <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-1 custom-scrollbar">
          <div className="text-slate-500 mb-2">Microsoft Windows [Version 10.0.19045.4291]<br/>(c) CloudGuardian Corp. All rights reserved.</div>
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2 text-slate-300">
              <span className="text-slate-600 shrink-0">{'>'}</span>
              <span className={log.includes("Error") ? "text-red-400" : log.includes("Success") || log.includes("encrypted") ? "text-emerald-400" : log.includes("Warning") ? "text-amber-400" : "text-slate-300"}>
                {log}
              </span>
            </div>
          ))}
          <div className="flex gap-2 items-center text-primary-500 animate-pulse">
            <span>{'>'}</span>
            <span className="w-2 h-4 bg-primary-500"></span>
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      {/* Terminal Footer */}
      {!isMinimized && (
        <div className="px-4 py-1 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-[9px] font-mono text-slate-500">
           <div className="flex gap-4">
              <span className="flex items-center gap-1"><Wifi size={10}/> 24ms</span>
              <span className="flex items-center gap-1"><Activity size={10}/> CPU: 12%</span>
           </div>
           <div>Mem: 402MB</div>
        </div>
      )}
    </div>
  );
};
