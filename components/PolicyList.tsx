import React, { useState, useEffect } from 'react';
import { policyService, Policy } from '../services/policyService';
import { Shield, Edit, Trash2, Plus, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';

interface PolicyListProps {
  onSelectPolicy: (policy: Policy | null) => void;
}

export const PolicyList: React.FC<PolicyListProps> = ({ onSelectPolicy }) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; enabled: number; totalPassed: number; totalFailed: number } | null>(null);
  const [filters, setFilters] = useState({ framework: 'all', type: 'all', enabled: 'all' });

  useEffect(() => {
    fetchPolicies();
    fetchStats();
  }, [filters]);

  const fetchPolicies = async () => {
    try {
      const params: any = {};
      if (filters.framework !== 'all') params.framework = filters.framework;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.enabled !== 'all') params.enabled = filters.enabled;
      const data = await policyService.list(params);
      setPolicies(data);
    } catch (error) {
      console.error('Erro ao carregar políticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await policyService.stats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta política?')) return;
    try {
      await axios.delete(`/api/v1/policies/${id}`);
      fetchPolicies();
      fetchStats();
    } catch (error) {
      alert('Erro ao excluir política');
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'text-red-500 bg-red-500/20',
      high: 'text-orange-500 bg-orange-500/20',
      medium: 'text-yellow-500 bg-yellow-500/20',
      low: 'text-blue-500 bg-blue-500/20',
      info: 'text-gray-400 bg-gray-500/20',
    };
    return colors[severity] || 'text-gray-400 bg-gray-500/20';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>;
  }

  return (
    <div className="bg-slate-900 text-white p-6 rounded-3xl border border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              Policy Forge
            </h1>
            <p className="text-gray-400 text-sm">Gerenciamento de políticas de compliance e segurança</p>
          </div>
          <button
            onClick={() => onSelectPolicy(null)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Política
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 border border-white/5 p-4 rounded-xl">
              <div className="text-sm text-gray-400">Total</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-slate-800 border border-white/5 p-4 rounded-xl">
              <div className="text-sm text-gray-400">Ativas</div>
              <div className="text-2xl font-bold text-emerald-400">{stats.enabled}</div>
            </div>
            <div className="bg-slate-800 border border-white/5 p-4 rounded-xl">
              <div className="text-sm text-gray-400">Passed</div>
              <div className="text-2xl font-bold text-emerald-400">{stats.totalPassed}</div>
            </div>
            <div className="bg-slate-800 border border-white/5 p-4 rounded-xl">
              <div className="text-sm text-gray-400">Failed</div>
              <div className="text-2xl font-bold text-red-400">{stats.totalFailed}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Filter className="w-4 h-4 text-gray-400 self-center" />
          <select
            value={filters.framework}
            onChange={(e) => setFilters({ ...filters, framework: e.target.value })}
            className="bg-slate-800 border border-gray-700 rounded-lg px-3 py-1 text-sm"
          >
            <option value="all">Todos frameworks</option>
            <option value="CIS">CIS</option>
            <option value="SOC2">SOC2</option>
            <option value="HIPAA">HIPAA</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="bg-slate-800 border border-gray-700 rounded-lg px-3 py-1 text-sm"
          >
            <option value="all">Todos tipos</option>
            <option value="security">Security</option>
            <option value="compliance">Compliance</option>
            <option value="cost">Cost</option>
          </select>
          <select
            value={filters.enabled}
            onChange={(e) => setFilters({ ...filters, enabled: e.target.value })}
            className="bg-slate-800 border border-gray-700 rounded-lg px-3 py-1 text-sm"
          >
            <option value="all">Todos status</option>
            <option value="true">Ativas</option>
            <option value="false">Inativas</option>
          </select>
          <button
            onClick={() => setFilters({ framework: 'all', type: 'all', enabled: 'all' })}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
          >
            Reset
          </button>
        </div>

        {/* Policy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies.length === 0 ? (
            <div className="col-span-full bg-slate-800 border border-white/5 rounded-2xl p-12 text-center">
              <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma política encontrada</h3>
              <p className="text-gray-400">Crie sua primeira política de compliance.</p>
            </div>
          ) : (
            policies.map((policy) => (
              <div key={policy.id} className="bg-slate-800 border border-white/5 rounded-2xl p-6 hover:bg-slate-750 transition-all hover:scale-105">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(policy.severity)}`}>
                      {policy.severity}
                    </span>
                    <span className="text-xs text-gray-400">{policy.framework}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onSelectPolicy(policy)} className="p-1 hover:bg-slate-700 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(policy.id)} className="p-1 hover:bg-red-900/50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1">{policy.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">{policy.description || 'Sem descrição'}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    {policy.enabled ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <span className={policy.enabled ? 'text-emerald-400' : 'text-red-400'}>
                      {policy.enabled ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  {policy.autoRemediate && (
                    <div className="flex items-center gap-1 text-blue-400">
                      <span>Auto-Remediate</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-sm">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>{policy.passedCount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="w-4 h-4" />
                    <span>{policy.failedCount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{policy.lastEvaluated ? new Date(policy.lastEvaluated).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
