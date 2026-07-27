import React, { useState } from 'react';
import { policyService, Policy } from '../services/policyService';
import { Save, XCircle, CheckCircle } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import axios from 'axios';

interface PolicyEditorProps {
  policy?: Policy | null;
  onSave: () => void;
  onClose: () => void;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({ policy, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: policy?.name || '',
    description: policy?.description || '',
    type: policy?.type || 'security',
    framework: policy?.framework || 'custom',
    severity: policy?.severity || 'high',
    regoCode: policy?.regoCode || 'package rules\n\ndeny[msg] {\n  # write rego logic here\n  msg := "violation"\n}',
    autoRemediate: policy?.autoRemediate || false,
    enabled: policy?.enabled ?? true,
  });
  const [validation, setValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    try {
      await axios.post('/api/v1/policies/validate', { regoCode: formData.regoCode });
      setValidation({ valid: true, message: 'Política válida!' });
    } catch (error: any) {
      setValidation({ valid: false, message: error.response?.data?.error || 'Erro na validação' });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (policy) {
        await policyService.update(policy.id, formData);
      } else {
        await policyService.create(formData);
      }
      onSave();
    } catch (error) {
      alert('Erro ao salvar política');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-white/5 rounded-[40px] p-10 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
          {policy ? 'Editar' : 'Nova'} <span className="text-blue-500">Política</span>
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <XCircle className="w-8 h-8" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Framework</label>
            <select
              value={formData.framework}
              onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none"
            >
              <option value="custom">Custom</option>
              <option value="CIS">CIS</option>
              <option value="SOC2">SOC2</option>
              <option value="HIPAA">HIPAA</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none"
            >
              <option value="security">Security</option>
              <option value="compliance">Compliance</option>
              <option value="cost">Cost</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Severidade</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex flex-col gap-4 p-4 bg-slate-950 rounded-2xl border border-white/5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-800"
              />
              <span className="text-sm font-semibold text-slate-300">Habilitada</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoRemediate}
                onChange={(e) => setFormData({ ...formData, autoRemediate: e.target.checked })}
                className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-800"
              />
              <span className="text-sm font-semibold text-slate-300">Auto-Remediate</span>
            </label>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rego Code</label>
            <div className="flex gap-2">
              <button
                onClick={handleValidate}
                disabled={loading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-2 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Validar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-[400px] bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/10 p-2">
            <MonacoEditor
              language="ruby"
              value={formData.regoCode}
              onChange={(value) => setFormData({ ...formData, regoCode: value || '' })}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                automaticLayout: true,
                padding: { top: 16 }
              }}
            />
          </div>
          {validation && (
            <div className={`p-4 rounded-2xl ${validation.valid ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className="flex items-center gap-2">
                {validation.valid ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                <span className={`text-sm font-medium ${validation.valid ? 'text-emerald-400' : 'text-red-400'}`}>{validation.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
