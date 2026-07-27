
import React, { useState, useEffect } from 'react';
import { 
  Save, Cloud, Key, ShieldCheck, RefreshCw, AlertCircle, 
  CheckCircle, Database, Globe, MessageSquare, Send, 
  BellRing, Share2, Settings as SettingsIcon, Loader2, Zap,
  BarChart3, HardDrive, Users, Cpu
} from 'lucide-react';
import { API } from '../services/backend';

import { NotificationSettings } from '../components/NotificationSettings';

export const Settings: React.FC = () => {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [quotas, setQuotas] = useState<any>(null);

  const [status, setStatus] = useState<Record<string, 'online' | 'offline'>>({
    AWS: 'online',
    Azure: 'offline',
    GCP: 'offline',
    Slack: 'offline'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [data, quotaData] = await Promise.all([
      API.getSystemSettings(),
      API.getQuotaUsage()
    ]);
    setSettings(data);
    setQuotas(quotaData);
    setLoadingSettings(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await API.saveSystemSettings(settings);
    setIsSaving(false);
    alert("Configurações aplicadas com sucesso!");
  };

  const testConnection = (provider: string) => {
    setConnecting(provider);
    setTimeout(() => {
      setStatus(prev => ({ ...prev, [provider]: 'online' }));
      setConnecting(null);
    }, 2000);
  };

  if (loadingSettings) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary-500" size={40} />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando Preferências...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-32">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <SettingsIcon className="text-primary-500" size={14} />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Console Management</span>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic text-glow">
          System <span className="text-primary-500">Control</span>
        </h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ConnectorCard provider="AWS" status={status.AWS} loading={connecting === 'AWS'} onTest={() => testConnection('AWS')} icon={<Cloud size={18}/>} />
        <ConnectorCard provider="Azure" status={status.Azure} loading={connecting === 'Azure'} onTest={() => testConnection('Azure')} icon={<Cloud size={18}/>} />
        <ConnectorCard provider="Supabase" status={status.GCP} loading={connecting === 'GCP'} onTest={() => testConnection('GCP')} icon={<Database size={18}/>} />
        <ConnectorCard provider="Clerk" status={status.Slack} loading={connecting === 'Slack'} onTest={() => testConnection('Slack')} icon={<Key size={18}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
           
           {/* Free Tier Monitor */}
           {quotas && (
             <section className="neo-card rounded-[40px] p-10 space-y-8 border border-white/5 bg-slate-900/40 shadow-xl">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <BarChart3 size={20} className="text-emerald-500" />
                      <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Zero-Cost Limits Monitor</h3>
                   </div>
                   <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">
                      Runway Healthy
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <QuotaBar 
                      label="Database Size" 
                      provider="Supabase"
                      used={quotas.database.used} 
                      limit={quotas.database.limit} 
                      unit={quotas.database.unit} 
                      icon={<Database size={14}/>}
                   />
                   <QuotaBar 
                      label="Monthly Active Users" 
                      provider="Clerk"
                      used={quotas.auth.used} 
                      limit={quotas.auth.limit} 
                      unit={quotas.auth.unit} 
                      icon={<Users size={14}/>}
                   />
                   <QuotaBar 
                      label="Serverless Invocations" 
                      provider="Vercel"
                      used={quotas.compute.used} 
                      limit={quotas.compute.limit} 
                      unit={quotas.compute.unit} 
                      icon={<Cpu size={14}/>}
                   />
                </div>
             </section>
           )}

           {/* Bootstrap Integrations */}
           <section className="neo-card rounded-[40px] p-10 space-y-8 border border-emerald-500/20 bg-emerald-950/10">
              <div className="flex items-center gap-3 text-emerald-500">
                 <Zap size={18} />
                 <h3 className="text-sm font-black uppercase tracking-[0.2em]">Bootstrap Integrations (Free Tier)</h3>
              </div>
              
              <div className="space-y-6">
                 <InputGroup 
                    label="Supabase Project URL" 
                    value={settings.supabaseUrl || ''} 
                    onChange={(v: string) => setSettings({...settings, supabaseUrl: v})}
                    placeholder="https://xyz.supabase.co"
                 />
                 <InputGroup 
                    label="Supabase Anon Key" 
                    value={settings.supabaseKey || ''} 
                    onChange={(v: string) => setSettings({...settings, supabaseKey: v})}
                    type="password"
                    placeholder="public-anon-key"
                 />
                 <div className="border-t border-emerald-500/20 pt-6">
                    <InputGroup 
                       label="Clerk Publishable Key" 
                       value={settings.clerkKey || ''} 
                       onChange={(v: string) => setSettings({...settings, clerkKey: v})}
                       type="text"
                       placeholder="pk_test_..."
                    />
                 </div>
              </div>
           </section>

           <NotificationSettings />

           <section className="neo-card rounded-[40px] p-10 space-y-10 border border-white/5">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  <Key size={18} className="text-primary-500" /> Infrastructure Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InputGroup 
                    label="Master Access Key ID" 
                    value={settings.accessKeyId} 
                    onChange={(v: string) => setSettings({...settings, accessKeyId: v})}
                  />
                  <InputGroup 
                    label="Storage Provider Region" 
                    value={settings.region} 
                    type="select" 
                    options={['us-east-1', 'eu-west-1', 'sa-east-1']}
                    onChange={(v: string) => setSettings({...settings, region: v})}
                  />
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  <BellRing size={18} className="text-indigo-500" /> Notification Webhooks
                </h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-6 bg-slate-950/60 rounded-3xl border border-white/5 group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-white/5 rounded-2xl text-slate-400">
                            <MessageSquare size={20} />
                         </div>
                         <div>
                            <div className="text-xs font-black text-white uppercase">Slack Workspace</div>
                            <div className="text-[10px] text-slate-500 font-bold mt-1">Send critical alerts to #sec-ops</div>
                         </div>
                      </div>
                      <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all">Config Hook</button>
                   </div>
                </div>
              </div>
           </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <section className="neo-card rounded-[40px] p-8 space-y-8 border border-white/5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">AI Engine Status</h3>
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-900/40">
                       <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div>
                       <div className="text-xs font-black text-white uppercase">Gemini 3 Pro</div>
                       <div className="text-[9px] text-emerald-500 font-black uppercase">Deep Analysis Active</div>
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase">
                   Cognitive reasoning engine processing infrastructure context in real-time.
                 </p>
              </div>

              <div className="space-y-6 pt-4">
                <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Automation Preference</h4>
                <div className="space-y-3">
                  <ConfigToggle 
                    label="Auto-Fix Low Severities" 
                    active={settings.notifications.autoFix} 
                    onToggle={() => setSettings({...settings, notifications: {...settings.notifications, autoFix: !settings.notifications.autoFix}})}
                  />
                  <ConfigToggle 
                    label="Nightly Drift Sync" 
                    active={settings.notifications.driftSync} 
                    onToggle={() => setSettings({...settings, notifications: {...settings.notifications, driftSync: !settings.notifications.driftSync}})}
                  />
                  <ConfigToggle 
                    label="SOC2 Evidence Logging" 
                    active={settings.notifications.soc2Logging} 
                    onToggle={() => setSettings({...settings, notifications: {...settings.notifications, soc2Logging: !settings.notifications.soc2Logging}})}
                  />
                </div>
              </div>
           </section>

           <div className="flex flex-col gap-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {isSaving ? 'Salvando...' : 'Save All Changes'}
              </button>
              <button 
                onClick={loadSettings}
                className="w-full py-4 bg-white/5 hover:bg-red-500/10 border border-white/5 text-slate-500 hover:text-red-500 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all"
              >
                Discard Updates
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const QuotaBar = ({ label, used, limit, unit, provider, icon }: any) => {
  const percentage = Math.min((used / limit) * 100, 100);
  const color = percentage > 85 ? 'bg-red-500' : percentage > 60 ? 'bg-amber-500' : 'bg-primary-500';
  
  return (
    <div className="space-y-3">
       <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
             <div className="text-slate-500">{icon}</div>
             <div>
                <div className="text-[10px] font-black text-white uppercase tracking-tight">{label}</div>
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{provider}</div>
             </div>
          </div>
          <div className="text-right">
             <div className="text-xs font-black text-white">{used.toLocaleString()} <span className="text-[8px] text-slate-500">{unit}</span></div>
             <div className="text-[8px] font-bold text-slate-600">of {limit.toLocaleString()}</div>
          </div>
       </div>
       <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
          <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
       </div>
    </div>
  );
};

const ConnectorCard = ({ provider, status, loading, onTest, icon }: any) => (
  <div className="neo-card p-6 rounded-[32px] space-y-4 border border-white/5">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-900 rounded-xl border border-white/5 text-primary-400">
          {icon}
        </div>
        <span className="text-[10px] font-black text-white uppercase tracking-tight">{provider}</span>
      </div>
      <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-700'}`}></div>
    </div>
    <button 
      onClick={onTest}
      disabled={loading}
      className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:border-primary-500/30 hover:text-white transition-all flex items-center justify-center gap-2"
    >
      {loading ? <Loader2 className="animate-spin" size={12} /> : <Share2 size={12} />}
      {loading ? 'Testing...' : 'Test Link'}
    </button>
  </div>
);

const InputGroup = ({ label, value, type, options, onChange, placeholder }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{label}</label>
    {type === 'select' ? (
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:border-primary-500 shadow-inner"
      >
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:border-primary-500 shadow-inner placeholder:text-slate-700" 
      />
    )}
  </div>
);

const ConfigToggle = ({ label, active, onToggle }: any) => (
  <div className="flex items-center justify-between group cursor-pointer" onClick={onToggle}>
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{label}</span>
    <div className={`w-10 h-5 rounded-full relative transition-all border ${active ? 'bg-primary-600 border-primary-500' : 'bg-slate-900 border-white/10'}`}>
      <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all bg-white ${active ? 'right-0.5' : 'left-0.5'}`}></div>
    </div>
  </div>
);
