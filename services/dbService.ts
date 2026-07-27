import { apiClient } from '../lib/api/client';
import { Project, OrgMember } from '../types';

export const dbService = {
  // Project Management - now uses real API
  async getProjects(): Promise<Project[]> {
    try {
      const response = await apiClient.get('/api/v1/projects');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch projects from API:', error);
      // Fallback to localStorage for offline resilience
      const saved = localStorage.getItem('cg_projects');
      if (saved) return JSON.parse(saved);
      return [
        { id: 'proj-1', name: 'Infrastructure-Prod', cloud: 'AWS', region: 'us-east-1', status: 'active', lastScan: new Date().toISOString(), score: 85 },
        { id: 'proj-2', name: 'Legacy-Backend', cloud: 'Azure', region: 'eastus', status: 'active', lastScan: new Date().toISOString(), score: 42 }
      ];
    }
  },

  async saveProject(project: Project) {
    try {
      if (project.id.startsWith('proj-')) {
        // New project (local ID pattern)
        await apiClient.post('/api/v1/projects', project);
      } else {
        await apiClient.patch(`/api/v1/projects/${project.id}`, project);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      // Fallback to localStorage
      const projects = JSON.parse(localStorage.getItem('cg_projects') || '[]');
      const index = projects.findIndex((p: Project) => p.id === project.id);
      if (index > -1) projects[index] = project;
      else projects.push(project);
      localStorage.setItem('cg_projects', JSON.stringify(projects));
    }
  },

  // Member Management - now uses real API
  async getMembers(): Promise<OrgMember[]> {
    try {
      const response = await apiClient.get('/api/v1/organization/members');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch members from API:', error);
      const saved = localStorage.getItem('cg_members');
      if (saved) return JSON.parse(saved);
      return [
        { id: 'mem-1', name: 'Admin', email: 'admin@cloudguardian.ai', role: 'admin', lastActive: 'Online' }
      ];
    }
  },

  async addMember(member: OrgMember) {
    try {
      await apiClient.post('/api/v1/organization/members', member);
    } catch (error) {
      console.error('Failed to add member:', error);
      const members = await this.getMembers();
      members.push(member);
      localStorage.setItem('cg_members', JSON.stringify(members));
    }
  },

  // Scan History - now uses real API
  async saveScan(vulnerabilities: any[], code: string) {
    try {
      const response = await apiClient.post('/api/v1/scans', {
        content: code,
        scan_type: 'terraform'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to save scan:', error);
      const scanRecord = {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        vulnsCount: vulnerabilities.length,
        code: code.substring(0, 100) + '...',
        fullCode: code
      };
      return scanRecord;
    }
  },

  async getScanHistory() {
    try {
      const response = await apiClient.get('/api/v1/scans/history');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      return [];
    }
  }
};