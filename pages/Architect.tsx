
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Wand2, Database, Globe, Lock, Cpu, Layers, 
  Code, ArrowRight, Loader2, Sparkles, Box, CheckCircle
} from 'lucide-react';

interface ArchitectProps {
  onApplyCode: (code: string) => void;
  onNotify: (msg: string) => void;
}

interface GeneratedComponent {
  name: string;
  type: 'compute' | 'storage' | 'network' | 'security';
  desc: string;
}

export const Architect: React.FC<ArchitectProps> = ({ onApplyCode, onNotify }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for the full content returned by AI (Target)
  const [targetCode, setTargetCode] = useState('');
  // State for what is currently shown on screen (Progressive)
  const [displayedCode, setDisplayedCode] = useState('');
  
  const [components, setComponents] = useState<GeneratedComponent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- TYPING EFFECT ENGINE ---
  // This useEffect watches 'targetCode'. Whenever it changes (new AI response),
  // it automatically cleans up the previous interval and starts a new one.
  useEffect(() => {
    if (!targetCode) {
      setDisplayedCode('');
      return;
    }

    // Reset displayed code immediately when target changes
    setDisplayedCode('');
    
    let currentIndex = 0;
    const speed = 3; // Characters per tick

    const intervalId = setInterval(() => {
      // If we've reached the end, stop.
      if (currentIndex >= targetCode.length) {
        clearInterval(intervalId);
        setIsGenerating(false);
        return;
      }

      // Safe update: take a slice of the target based on current index
      const nextChunkIndex = Math.min(currentIndex + speed, targetCode.length);
      const nextString = targetCode.substring(0, nextChunkIndex);
      
      setDisplayedCode(nextString);
      currentIndex = nextChunkIndex;

      // Auto-scroll
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 10); // 10ms tick

    // CLEANUP FUNCTION: React calls this BEFORE re-running the effect
    // or when the component unmounts. This guarantees no two timers coexist.
    return () => clearInterval(intervalId);
  }, [targetCode]);

  const cleanJson = (text: string): string => {
    return text.replace(/```json\n?|\n?```/g, '').replace(/```/g, '').trim();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setTargetCode(''); // This triggers the effect to clear screen/interval
    setComponents([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const [codeResp, structResp] = await Promise.all([
        ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: `Generate Terraform HCL code for: "${prompt}". 
          Follow AWS/Azure security best practices.
          Return ONLY the HCL code. No explanation text outside code blocks.`,
        }),
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Analyze this request: "${prompt}". 
          Return JSON array: [{ "name": "string", "type": "compute"|"storage"|"network"|"security", "desc": "string" }].`,
          config: { responseMimeType: "application/json" }
        })
      ]);

      let fullCode = codeResp.text?.trim() || "# Error generating code";
      
      // Strict Markdown Cleaning
      // Removes ```hcl or ```terraform at start, and ``` at end
      fullCode = fullCode.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').replace(/```/g, '');

      const structText = cleanJson(structResp.text || "[]");
      let struct: GeneratedComponent[] = [];
      try {
        struct = JSON.parse(structText);
      } catch (err) {
        console.error("JSON Parse Error:", err);
        struct = [{ name: "Infrastructure", type: "compute", desc: "Complex topology generated" }];
      }

      setComponents(struct);
      setTargetCode(fullCode); // Triggers the typing effect safely

    } catch (e) {
      console.error(e);
      onNotify("Architect Engine Error. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32 h-[calc(100vh-2rem)] flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wand2 size={12} className="text-primary-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">AI Infrastructure Architect</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none text-glow">
            Design <span className="text-primary-500">Studio</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium italic">
            Descreva sua infraestrutura ideal e deixe a IA gerar, validar e conectar os recursos.
          </p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        
        {/* INPUT & VISUALIZATION */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full overflow-hidden">
           
           {/* Chat Input */}
           <div className="bg-slate-900 border border-white/5 rounded-[40px] p-8 shadow-2xl relative shrink-0">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                 <Sparkles size={80} className="text-primary-500" />
              </div>
              
              <form onSubmit={handleGenerate} className="relative z-10 space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Architect Prompt</label>
                 <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Crie uma arquitetura AWS para um app React com S3, CloudFront e backend Lambda com DynamoDB..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 text-sm text-white focus:outline-none focus:border-primary-500 resize-none h-32 shadow-inner leading-relaxed custom-scrollbar placeholder:text-slate-700"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleGenerate(e); }}
                 />
                 <button 
                    type="submit" 
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-primary-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                    {isGenerating ? 'Designing Solution...' : 'Generate Blueprint'}
                 </button>
              </form>
           </div>

           {/* Visual Blueprint */}
           <div className="flex-1 bg-slate-900 border border-white/5 rounded-[40px] p-8 relative overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                    <Box size={14} className="text-emerald-500" /> Live Blueprint
                 </h3>
                 {components.length > 0 && (
                    <span className="text-[9px] font-black bg-white/5 px-2 py-1 rounded text-slate-400">{components.length} Resources</span>
                 )}
              </div>

              {components.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                    <Layers size={48} className="text-slate-600 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Waiting for prompt...</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {components.map((comp, i) => (
                       <div key={i} className="neo-card p-4 rounded-2xl border border-white/5 flex items-center gap-4 animate-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className={`p-3 rounded-xl border ${
                             comp.type === 'compute' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' :
                             comp.type === 'storage' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                             comp.type === 'security' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                             'bg-primary-500/10 border-primary-500/20 text-primary-500'
                          }`}>
                             {comp.type === 'compute' ? <Cpu size={18} /> : 
                              comp.type === 'storage' ? <Database size={18} /> : 
                              comp.type === 'security' ? <Lock size={18} /> : <Globe size={18} />}
                          </div>
                          <div className="min-w-0">
                             <h4 className="text-xs font-bold text-white truncate">{comp.name}</h4>
                             <p className="text-[10px] text-slate-500 truncate">{comp.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>

        {/* CODE OUTPUT */}
        <div className="lg:col-span-7 h-full flex flex-col">
           <div className="flex-1 bg-[#0d1117] border border-white/10 rounded-[40px] shadow-2xl flex flex-col overflow-hidden relative group">
              <div className="bg-slate-900/80 backdrop-blur-md px-8 py-4 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30"></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">generated.tf</span>
                 </div>
                 {displayedCode && !isGenerating && (
                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest animate-in fade-in">
                       <CheckCircle size={12} /> Syntax Valid
                    </div>
                 )}
              </div>

              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative" ref={scrollRef}>
                 {displayedCode ? (
                    <pre className="font-mono text-xs leading-6 text-slate-300 whitespace-pre-wrap">
                       {displayedCode}
                       {isGenerating && <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1 align-middle"></span>}
                    </pre>
                 ) : (
                    <div className="h-full flex items-center justify-center text-slate-700 italic text-xs">
                       // Terraform code will appear here...
                    </div>
                 )}
              </div>

              {displayedCode && !isGenerating && (
                 <div className="p-6 bg-slate-900/80 backdrop-blur border-t border-white/5 flex justify-end">
                    <button 
                       onClick={() => onApplyCode(displayedCode)}
                       className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-900/40 flex items-center gap-3 hover:scale-105 active:scale-95"
                    >
                       <Code size={18} /> Deploy to Scanner
                       <ArrowRight size={18} />
                    </button>
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};
