import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { ShieldCheck, ShieldAlert, ShieldX, TrendingUp, ChevronDown, ChevronUp, Cpu, Lock, FileCheck, Layers, DollarSign } from 'lucide-react';
import { SecurityScore } from '../types';

interface SecurityScoreGaugeProps {
  score: SecurityScore;
  className?: string;
  compact?: boolean;
}

export const SecurityScoreGauge: React.FC<SecurityScoreGaugeProps> = ({ score, className = '', compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  // Determine color theme based on total score
  const getScoreTheme = (val: number) => {
    if (val >= 80) {
      return {
        text: 'text-emerald-400',
        stroke: '#10b981',
        strokeGradientFrom: '#34d399',
        strokeGradientTo: '#059669',
        bgGlow: 'rgba(16, 185, 129, 0.15)',
        border: 'border-emerald-500/30',
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        label: 'OPTIMAL',
        Icon: ShieldCheck
      };
    } else if (val >= 50) {
      return {
        text: 'text-amber-400',
        stroke: '#f59e0b',
        strokeGradientFrom: '#fbbf24',
        strokeGradientTo: '#d97706',
        bgGlow: 'rgba(245, 158, 11, 0.15)',
        border: 'border-amber-500/30',
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        label: 'WARNING',
        Icon: ShieldAlert
      };
    } else {
      return {
        text: 'text-red-400',
        stroke: '#ef4444',
        strokeGradientFrom: '#f87171',
        strokeGradientTo: '#dc2626',
        bgGlow: 'rgba(239, 68, 68, 0.15)',
        border: 'border-red-500/30',
        badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20',
        label: 'CRITICAL',
        Icon: ShieldX
      };
    }
  };

  const theme = getScoreTheme(score.total);

  useEffect(() => {
    const controls = animate(count, score.total, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      }
    });
    return () => controls.stop();
  }, [score.total, count]);

  // SVG Gauge calculations
  const size = compact ? 56 : 84;
  const strokeWidth = compact ? 5 : 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  const subMetrics = [
    { name: 'Infrastructure', val: score.infrastructure, icon: Cpu },
    { name: 'Secrets', val: score.secrets, icon: Lock },
    { name: 'Compliance', val: score.compliance, icon: FileCheck },
    { name: 'Drift', val: score.drift, icon: Layers },
    { name: 'FinOps', val: score.finops, icon: DollarSign },
  ];

  if (compact) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`bg-slate-900/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl flex items-center gap-3 relative overflow-hidden group shadow-lg ${className}`}
      >
        <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <span className={`absolute text-sm font-black font-mono tracking-tight ${theme.text}`}>
            {displayValue}
          </span>
        </div>
        <div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Security Score</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${theme.badgeBg}`}>
              {theme.label}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`bg-slate-900/90 backdrop-blur-md border ${theme.border} p-5 rounded-2xl relative overflow-hidden shadow-2xl transition-all duration-300 ${className}`}
    >
      {/* Background Glow Effect */}
      <motion.div 
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: theme.bgGlow }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main Row */}
      <div className="flex items-center justify-between gap-6 relative z-10">
        
        {/* Left Side: Label & Icon */}
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`p-3 rounded-xl bg-slate-950 border border-white/10 ${theme.text} shadow-xl relative overflow-hidden`}
          >
            <theme.Icon size={26} />
            <motion.div 
              className="absolute inset-0 bg-white/10"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
          </motion.div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Security posture</span>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${theme.badgeBg}`}>
                {theme.label}
              </span>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase italic flex items-center gap-2">
              Security Score
            </h3>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
              <TrendingUp size={12} className="text-emerald-400" />
              <span>Real-time evaluation</span>
            </div>
          </div>
        </div>

        {/* Right Side: Animated Circular Counter Gauge */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Outer Pulsing Ring */}
            <motion.div 
              className="absolute inset-0 rounded-full border border-current pointer-events-none"
              style={{ color: theme.stroke, opacity: 0.2 }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <svg width={size} height={size} className="transform -rotate-90">
              <defs>
                <linearGradient id={`scoreGrad-${score.total}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={theme.strokeGradientFrom} />
                  <stop offset="100%" stopColor={theme.strokeGradientTo} />
                </linearGradient>
              </defs>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={`url(#scoreGrad-${score.total})`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>

            {/* Centered Large Number */}
            <div className="absolute flex flex-col items-center justify-center">
              <motion.span 
                className={`text-2xl font-black font-mono tracking-tighter ${theme.text}`}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {displayValue}
              </motion.span>
              <span className="text-[8px] font-mono text-slate-500 uppercase -mt-1">/100</span>
            </div>
          </div>

          {/* Toggle Breakdown Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all"
            title="Toggle Sub-metrics"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expandable Sub-metrics Section */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <div className="pt-5 mt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-5 gap-3">
          {subMetrics.map((item, idx) => {
            const IconComponent = item.icon;
            const subTheme = item.val >= 80 ? 'text-emerald-400 bg-emerald-500' : item.val >= 50 ? 'text-amber-400 bg-amber-500' : 'text-red-400 bg-red-500';
            
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isExpanded ? 1 : 0, y: isExpanded ? 0 : 10 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-slate-950/80 border border-white/5 p-3 rounded-xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono font-bold uppercase">
                    <IconComponent size={12} className="text-slate-400" />
                    <span>{item.name}</span>
                  </div>
                  <span className={`text-xs font-mono font-black ${subTheme.split(' ')[0]}`}>{item.val}%</span>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${subTheme.split(' ')[1]}`}
                    initial={{ width: 0 }}
                    animate={{ width: isExpanded ? `${item.val}%` : 0 }}
                    transition={{ duration: 0.8, delay: 0.2 + idx * 0.05, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};
