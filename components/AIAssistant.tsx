import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, User } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Safe API Key Access
const getApiKey = () => {
  try {
    // @ts-ignore
    return (window.process?.env?.API_KEY) || (process?.env?.API_KEY) || '';
  } catch {
    return '';
  }
};

export const AIAssistant: React.FC<{ code: string }> = ({ code }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am the CloudGuardian Copilot. How can I assist with your infrastructure security today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error("API Key not found. Please configure process.env.API_KEY.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Terraform HCL Context:\n${code}\n\nUser Question: ${userMsg}`,
        config: {
          systemInstruction: "You are the CloudGuardian AI Copilot, an expert in DevSecOps and cloud security (AWS/Azure/GCP). Provide concise, technical, and actionable security advice. Use markdown for code blocks.",
        }
      });

      const text = response.text || "I encountered an issue processing that request. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || "Unable to reach AI engine."}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-[100] border border-primary-400/30"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
      </button>

      <div className={`fixed bottom-24 right-6 w-96 h-[520px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.7)] flex flex-col z-[105] transition-all duration-300 transform origin-bottom-right overflow-hidden ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <header className="p-4 bg-slate-800/80 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="text-primary-400" size={20} />
            <span className="font-black text-[10px] text-white uppercase tracking-widest">Security Copilot</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1"><X size={18} /></button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user' 
                 ? 'bg-primary-600 text-white rounded-tr-none shadow-lg' 
                 : 'bg-slate-800/60 text-slate-300 rounded-tl-none border border-white/5'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2">
                <Loader2 className="animate-spin text-primary-500" size={14} />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Reasoning...</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/80 border-t border-white/5">
          <div className="relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your infrastructure security..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-3 px-5 pr-12 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-500 transition-all shadow-inner"
            />
            <button type="submit" disabled={!input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-400 disabled:opacity-30 p-1 transition-colors">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
