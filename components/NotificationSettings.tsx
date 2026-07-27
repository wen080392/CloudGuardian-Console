import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Save } from 'lucide-react';

export const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    slackWebhook: '',
    teamsWebhook: '',
    emailRecipients: [] as string[],
    enabledEvents: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/v1/notifications');
      setSettings(res.data || { enabledEvents: [] });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/v1/notifications', settings);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (event: string) => {
    setSettings(prev => ({
      ...prev,
      enabledEvents: prev.enabledEvents.includes(event)
        ? prev.enabledEvents.filter(e => e !== event)
        : [...prev.enabledEvents, event],
    }));
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-700 rounded"></div></div></div>;
  }

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-500/20 rounded-xl">
            <Bell className="w-6 h-6 text-blue-400" />
        </div>
        <div>
            <h2 className="text-xl font-bold">Notificações e Alertas</h2>
            <p className="text-sm text-gray-400">Configure integrações com Slack, Teams e Email.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Slack Webhook URL</label>
          <input
            type="url"
            value={settings.slackWebhook || ''}
            onChange={(e) => setSettings({ ...settings, slackWebhook: e.target.value })}
            className="w-full bg-slate-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="https://hooks.slack.com/services/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Microsoft Teams Webhook URL</label>
          <input
            type="url"
            value={settings.teamsWebhook || ''}
            onChange={(e) => setSettings({ ...settings, teamsWebhook: e.target.value })}
            className="w-full bg-slate-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="https://outlook.office.com/webhook/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Emails (separados por vírgula)</label>
          <input
            type="text"
            value={settings.emailRecipients?.join(', ') || ''}
            onChange={(e) => setSettings({ ...settings, emailRecipients: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="w-full bg-slate-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="security@empresa.com, ciso@empresa.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">Eventos a Notificar</label>
          <div className="flex flex-wrap gap-4">
            {['drift', 'vulnerability', 'report'].map(event => (
              <label key={event} className="flex items-center gap-2 cursor-pointer bg-slate-800 px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enabledEvents.includes(event)}
                  onChange={() => toggleEvent(event)}
                  className="rounded border-gray-700 text-blue-500 focus:ring-blue-500 bg-slate-900"
                />
                <span className="text-sm capitalize font-medium">{event}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            {saving ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Save className="w-5 h-5" />}
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};
