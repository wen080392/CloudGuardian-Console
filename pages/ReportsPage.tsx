import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Plus, Calendar, Filter } from 'lucide-react';

export const ReportsPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState({ framework: 'all' });

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.framework !== 'all') params.append('framework', filters.framework);
      const res = await axios.get(`/api/v1/reports?${params}`);
      setReports(res.data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Exemplo: gerar relatório CIS do último mês
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      const response = await axios.post('/api/v1/reports', {
        framework: 'CIS',
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          label: `${start.toLocaleString('default', { month: 'long' })} ${start.getFullYear()}`
        }
      }, { responseType: 'blob' });
      // Download do PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CIS_Report_${Date.now()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      fetchReports();
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>;
  }

  return (
    <div className="bg-slate-900 text-white p-6 rounded-3xl border border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              Relatórios Executivos
            </h1>
            <p className="text-gray-400 text-sm">Gere relatórios de compliance em PDF</p>
          </div>
          <button
            onClick={generateReport}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            {generating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Plus className="w-4 h-4" />}
            {generating ? 'Gerando...' : 'Novo Relatório'}
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <Filter className="w-4 h-4 text-gray-400 self-center" />
          <select
            value={filters.framework}
            onChange={(e) => setFilters({ ...filters, framework: e.target.value })}
            className="bg-slate-800 border border-gray-700 rounded-lg px-3 py-1 text-sm outline-none"
          >
            <option value="all">Todos frameworks</option>
            <option value="CIS">CIS</option>
            <option value="SOC2">SOC2</option>
            <option value="HIPAA">HIPAA</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.length === 0 ? (
            <div className="col-span-full bg-slate-800 border border-white/5 rounded-2xl p-12 text-center">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum relatório gerado</h3>
              <p className="text-gray-400">Clique em "Novo Relatório" para começar.</p>
            </div>
          ) : (
            reports.map(report => (
              <div key={report.id} className="bg-slate-800 border border-white/5 rounded-2xl p-6 hover:bg-slate-750 transition-all hover:scale-105">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{report.title}</h3>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 font-bold uppercase">
                    {report.status}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  Framework: {report.framework}
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm flex items-center gap-1 transition-colors">
                    <Download className="w-4 h-4" />
                    Baixar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
