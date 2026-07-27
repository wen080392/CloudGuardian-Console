import axios from 'axios';

const API_BASE = '/api/v1/policies';

export interface Policy {
  id: string;
  name: string;
  description?: string;
  type: string;
  framework?: string;
  severity: string;
  regoCode: string;
  enabled: boolean;
  autoRemediate: boolean;
  passedCount: number;
  failedCount: number;
  lastEvaluated?: string;
  createdAt: string;
  updatedAt: string;
}

export const policyService = {
  // Listar todas as políticas (com filtros opcionais)
  list: async (params?: { framework?: string; type?: string; enabled?: boolean | string }) => {
    const response = await axios.get<Policy[]>(API_BASE, { params });
    return response.data;
  },

  // Obter uma política por ID
  get: async (id: string) => {
    const response = await axios.get<Policy>(`${API_BASE}/${id}`);
    return response.data;
  },

  // Criar nova política
  create: async (data: Omit<Policy, 'id' | 'passedCount' | 'failedCount' | 'createdAt' | 'updatedAt'>) => {
    const response = await axios.post<Policy>(API_BASE, data);
    return response.data;
  },

  // Atualizar política existente
  update: async (id: string, data: Partial<Policy>) => {
    const response = await axios.put<Policy>(`${API_BASE}/${id}`, data);
    return response.data;
  },

  // Avaliar política contra um recurso
  evaluate: async (id: string, resource: any) => {
    const response = await axios.post(`${API_BASE}/${id}/evaluate`, { resource });
    return response.data;
  },

  // Obter estatísticas
  stats: async () => {
    const response = await axios.get(`${API_BASE}/stats`);
    return response.data;
  },
};
