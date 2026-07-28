
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import React, { useEffect, useRef, useState } from 'react';
import { useJarvisAdvisor } from '../hooks/useJarvisAdvisor';

import { Mic, X, Loader2, Bot, Shield, AlertCircle, Square, Zap, ShieldAlert } from 'lucide-react';

interface LiveAssistantProps {
  onClose: () => void;
  codeContext: string;
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

export const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose, codeContext }) => {

  const { requestJarvisReport, stopJarvisReport, isPlaying: isJarvisPlaying, isGenerating: isJarvisGenerating, error: jarvisError } = useJarvisAdvisor();
  const [status, setStatus] = useState<'connecting' | 'active' | 'error' | 'closed'>('connecting');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    let inputAudioContext: AudioContext;
    let outputAudioContext: AudioContext;
    let stream: MediaStream;

    const initializeLiveSession = async () => {
      try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key missing");

        const ai = new GoogleGenAI({ apiKey });
        
        inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outputAudioContext;
        
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus('active');
              const source = inputAudioContext.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData) {
                setIsSpeaking(true);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decodeBase64(audioData), outputAudioContext);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsSpeaking(false);
                };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
              }
            },
            onerror: (e) => {
              console.error('Live Assistant Error:', e);
              setStatus('error');
            },
            onclose: () => setStatus('closed'),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
            },
            systemInstruction: `Você é o CloudGuardian Live Security Advisor. Sua missão é fornecer consultoria técnica de alto nível em tempo real sobre segurança em nuvem e infraestrutura como código (IaC). 
            Contexto atual do código Terraform: 
            ${codeContext}
            
            Sempre mencione conformidade com SOC2, ISO27001 e CIS Benchmarks quando relevante. Seja direto, técnico e ajude o usuário a identificar e corrigir falhas graves imediatamente.`,
          },
        });

        sessionRef.current = sessionPromise;
      } catch (err) {
        console.error('Failed to init Live Assistant:', err);
        setStatus('error');
      }
    };

    initializeLiveSession();

    return () => {
      if (inputAudioContext) inputAudioContext.close();
      if (outputAudioContext) outputAudioContext.close();
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close());
      }
    };
  }, [codeContext]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300 p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[48px] shadow-2xl p-12 relative overflow-hidden flex flex-col items-center text-center gap-8 border-t-primary-500 border-t-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="relative">
          <div className={`w-32 h-32 rounded-full bg-slate-950 border-2 flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-110 border-primary-500 shadow-[0_0_50px_rgba(59,130,246,0.3)]' : 'border-slate-800'}`}>
             <Bot size={64} className={`${isSpeaking ? 'text-primary-400' : 'text-slate-700'}`} />
          </div>
          {status === 'active' && (
            <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-slate-900 flex items-center justify-center text-white shadow-lg transition-colors ${isSpeaking ? 'bg-primary-500' : 'bg-emerald-500'}`}>
              <Mic size={18} />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Live Advisor <span className="text-primary-500">v2.5</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            {status === 'connecting' ? 'Establishing Encrypted Link...' : 
             status === 'active' ? (isSpeaking ? 'Analyzing Infrastructure...' : 'Awaiting Technical Inquiry...') : 
             status === 'error' ? 'Connection Failed (Check API Key)' : 'Session Terminated'}
          </p>
        </div>

        <div className="w-full h-16 flex items-center justify-center gap-2">
          {status === 'active' ? (
            Array.from({ length: 30 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-1 rounded-full transition-all duration-150 ${isSpeaking ? 'bg-primary-500 animate-pulse' : 'bg-slate-800 h-2'}`}
                style={{ 
                  animationDelay: `${i * 0.04}s`, 
                  height: isSpeaking ? `${30 + Math.random() * 70}%` : '6px' 
                }}
              />
            ))
          ) : (
            <Loader2 className="animate-spin text-slate-700" size={32} />
          )}
        </div>

        <div className="bg-slate-950/60 p-6 rounded-3xl border border-white/5 w-full text-left flex items-start gap-4 shadow-inner relative overflow-hidden group">
          <div className="absolute inset-y-0 left-0 w-1 bg-primary-500"></div>
          <Shield className="text-primary-500 shrink-0" size={24} />
          <div>
            <p className="text-[10px] font-black text-white uppercase mb-1 tracking-widest">Capacidade Analítica:</p>
            <p className="text-[11px] text-slate-500 leading-relaxed italic font-medium">
              "Análise de regressão de riscos, mapeamento de conformidade CIS v8 e remediação em tempo real."
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-slate-800 hover:bg-red-600/20 hover:text-red-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 border border-white/5"
        >
          <Square size={16} fill="currentColor" />
          Encerrar Sessão Consultiva
        </button>

        <button 
          onClick={() => {
            if (isJarvisPlaying) {
              stopJarvisReport();
            } else {
              requestJarvisReport(codeContext);
            }
          }}
          disabled={isJarvisGenerating}
          className={`w-full py-4 ${isJarvisPlaying ? 'bg-primary-600/20 text-primary-400' : 'bg-slate-800 hover:bg-slate-700'} text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 border border-white/5`}
        >
          {isJarvisGenerating ? (
            <><Loader2 size={16} className="animate-spin" /> GERANDO RELATÓRIO J.A.R.V.I.S...</>
          ) : isJarvisPlaying ? (
            <><Square size={16} fill="currentColor" /> PARAR RELATÓRIO J.A.R.V.I.S.</>
          ) : (
            <><Zap size={16} fill="currentColor" /> SINTETIZAR RELATÓRIO J.A.R.V.I.S.</>
          )}
        </button>
        {jarvisError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase text-center mt-2">
            Erro: {jarvisError}
          </div>
        )}


        {status === 'error' && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 animate-bounce">
            <AlertCircle size={20} />
            <span className="text-xs font-black uppercase tracking-tight">Erro de Handshake. Verifique se a API está online.</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Real-time PCM Utilities ---
function createPcmBlob(data: Float32Array): any {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encodeBase64(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}
