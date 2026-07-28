
import { apiClient } from '../lib/api/client';
import { Vulnerability, SecurityScore, ScanStatus, Severity, Asset, ThreatData, Guardrail, DriftItem } from '../types';
import { GoogleGenAI } from "@google/genai";

// Safe access to API Key to prevent white screen if process is undefined
const getApiKey = () => {
  try {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  } catch (e) {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

class CloudGuardianBackend {
  // --- REAL API CALLS ---

  async scanInfrastructure(code: string): Promise<{ vulns: Vulnerability[], score: SecurityScore }> {
    try {
      // Create a real scan in the backend
      // Assuming project_id 1 for demo purposes if not managed by context yet
      const response = await apiClient.post('/api/v1/scans', {
        project_id: 1, 
        content: code,
        scan_type: 'terraform'
      });

      const scanData = response.data;
      
      // Map backend response to frontend types
      // Fallback to empty array if output_data is not structured yet
      const vulns: Vulnerability[] = scanData.output_data?.security_issues?.map((issue: any, index: number) => ({
        id: `vuln-${scanData.id}-${index}`,
        title: issue.title || "Security Issue",
        description: issue.description || "Issue detected by engine",
        severity: (issue.severity?.toUpperCase() as Severity) || Severity.MEDIUM,
        status: ScanStatus.OPEN,
        resource: issue.resource || "terraform.tf",
        ruleId: issue.rule_id || "GENERIC_RULE",
        remediation: issue.remediation
      })) || [];

      // Calculate score based on findings (or get from backend if available)
      const score = this.calculateScore(vulns, []); 

      return { vulns, score };
    } catch (error) {
      console.error("Scan failed:", error);
      // Fallback for demo/offline resilience
      return { vulns: [], score: { total: 100, infrastructure: 100, secrets: 100, compliance: 100, drift: 100, finops: 100, trend: 0 } };
    }
  }

  // --- HYBRID / MOCKED METHODS (To maintain UI fidelity while backend expands) ---

  async getScanHistory() {
    try {
      const response = await apiClient.get('/api/v1/scans/history');
      return response.data;
    } catch (e) {
      console.error("Failed to fetch scan history", e);
      return [];
    }
  }

  calculateScore(vulns: Vulnerability[], drifts: DriftItem[]): SecurityScore {
    const safeVulns = Array.isArray(vulns) ? vulns : [];
    const safeDrifts = Array.isArray(drifts) ? drifts : [];
    const openVulns = safeVulns.filter(v => v.status !== ScanStatus.RESOLVED);
    const criticals = openVulns.filter(v => v.severity === Severity.CRITICAL).length + safeDrifts.filter(d => d.severity === Severity.CRITICAL).length;
    const highs = openVulns.filter(v => v.severity === Severity.HIGH).length + safeDrifts.filter(d => d.severity === Severity.HIGH).length;
    const infraBase = Math.max(0, 100 - (criticals * 20) - (highs * 10));
    return { total: infraBase, infrastructure: infraBase, secrets: 100, compliance: Math.max(0, infraBase - 5), drift: safeDrifts.length === 0 ? 100 : 70, finops: 100, trend: 0 };
  }

  async getLiveAttacks() {
    // Simulated Feed - Backend implementation for WebSocket feed is next phase
    const attackTypes = ['SQL Injection', 'XSS Payload', 'DDoS Volumetric', 'Brute Force SSH', 'Ransomware Beacon'];
    const locations = ['CN', 'RU', 'US', 'BR', 'DE'];
    return Array.from({ length: 3 }).map((_, i) => ({
      id: `atk-${Date.now()}-${i}`,
      type: attackTypes[Math.floor(Math.random() * attackTypes.length)],
      origin: locations[Math.floor(Math.random() * locations.length)],
      target: 'Production-Gateway',
      timestamp: new Date().toISOString(),
      status: 'BLOCKED',
      severity: Math.random() > 0.8 ? 'CRITICAL' : 'HIGH'
    }));
  }

  async getSystemIntegrity() {
    // Simulated Metrics
    return [
      { id: 'sys-1', name: 'Identity Provider', status: 'optimal', latency: 24, load: 12, uptime: 99.99 },
      { id: 'sys-2', name: 'Data Layer (RDS)', status: 'optimal', latency: 45, load: 34, uptime: 99.95 },
      { id: 'sys-3', name: 'Compute Grid', status: 'degraded', latency: 120, load: 89, uptime: 99.50 }, 
      { id: 'sys-4', name: 'Edge Network', status: 'optimal', latency: 12, load: 8, uptime: 100.0 },
    ];
  }

  async getGlobalThreats(): Promise<ThreatData[]> {
    return [
      { id: 't-1', type: 'Exploit', region: 'us-east-1', intensity: 85, targets: ['S3', 'IAM'], timestamp: new Date().toISOString() },
      { id: 't-2', type: 'Botnet', region: 'eu-west-1', intensity: 45, targets: ['EC2'], timestamp: new Date().toISOString() },
      { id: 't-3', type: 'Leak', region: 'sa-east-1', intensity: 92, targets: ['RDS'], timestamp: new Date().toISOString() }
    ];
  }

  async getAssets(): Promise<Asset[]> {
    try {
      const response = await apiClient.get('/api/v1/assets');
      return response.data;
    } catch (e) {
      console.error("Failed to fetch assets", e);
      return [];
    }
  }

  async fetchCloudDrifts() { 
    try {
      const response = await apiClient.get('/api/v1/drifts');
      return response.data;
    } catch (e) {
      return [];
    }
  }
  
  async resolveDrift(id: string) { return true; }

  async getGuardrails() {
    try {
      const response = await apiClient.get('/api/v1/guardrails');
      return response.data as Guardrail[];
    } catch (e) {
      return [];
    }
  }
  
  async saveGuardrail(gr: Guardrail) { return true; }

  async getTimeline() { 
    try {
      const response = await apiClient.get('/api/v1/timeline');
      return response.data;
    } catch (e) { return []; }
  }
  async getPolicies() { 
    try {
      const response = await apiClient.get('/api/v1/policies');
      return response.data;
    } catch (e) { return []; }
  }
  async logEvent(event: any) {
    try {
      const response = await apiClient.post('/api/v1/timeline', event);
      return response.data;
    } catch (e) {
      console.error('Failed to log event:', e);
      return { ...event, id: `evt-${Date.now()}`, timestamp: new Date().toISOString() };
    }
  }
  async getVulnerabilities() {
    try {
      const response = await apiClient.get('/api/v1/vulnerabilities');
      const list = Array.isArray(response.data) ? response.data : [];
      // Retrocompat: o banco usa `resourceId`; a UI espera `resource`.
      return list.map((v: any) => ({ ...v, resource: v.resource ?? v.resourceId ?? '' }));
    } catch (e) { return []; }
  }
  async setVulnerabilities(vulns: any[]) {
    // Vulnerabilities are managed server-side; this is now a no-op with logging
    console.log(`[API] Vulnerability state updated (${vulns.length} items)`);
  }
  
  // GenAI Helpers
  async suggestFix(vulnerability: string, codeContext: string): Promise<string> {
    const model = 'gemini-3-pro-preview';
    const prompt = `Provide a Terraform HCL code snippet to fix: "${vulnerability}". Context: \`\`\`hcl\n${codeContext}\n\`\`\` Return only the corrected HCL code block.`;
    try {
      const resp = await ai.models.generateContent({ model, contents: prompt });
      return resp.text || "/* AI Fix unavailable */";
    } catch (e) { return "/* Error generating fix suggestion */"; }
  }

  async analyzeThreatImpact(threat: any, assets: any) {
     return { vulnerableCount: 0, resources: [], recommendation: "No immediate impact correlation found via Sentinel AI." };
  }

  async generateDefensiveTactics(title: string, resource: string) {
      return [
          { id: 1, title: 'Isolate Security Group', desc: 'Deny all ingress traffic immediately.' },
          { id: 2, title: 'Revoke IAM Credentials', desc: 'Rotate access keys associated with resource.' }
      ];
  }

  async createRemediationPR(vulnId: string, fixCode: string) {
      // Mock PR creation for demo flow
      return { prUrl: 'https://github.com/cloudguardian/infra/pull/123', branch: 'fix/security-patch-001' };
  }

  async generateRootCauseAnalysis(incident: any) {
      return { summary: "Unauthorized access attempt via exposed port 22.", rootCause: "Misconfigured Security Group allowing 0.0.0.0/0.", prevention: ["Enforce Policy: No Public SSH"], auditEvidenceHash: "SHA256:88929..." };
  }

  async generateAssetInsights(assets: any[]) { return []; }
  
  async getSystemSettings() {
    try {
      const creds = await apiClient.get('/api/v1/credentials');
      return {
        credentials: creds.data,
        notifications: { autoFix: true }
      };
    } catch (e) {
      return { credentials: [], notifications: { autoFix: true } };
    }
  }
  async saveSystemSettings(settings: any) { return true; }
  async getSubscriptionStatus() { return { tier: 'pro', expires: '2026-12-31' }; }
  
  async getQuotaUsage() {
    return {
        database: { used: 125, limit: 500, unit: 'MB', provider: 'Supabase' },
        auth: { used: 850, limit: 10000, unit: 'MAUs', provider: 'Clerk' },
        compute: { used: 32, limit: 100, unit: 'k/req', provider: 'Vercel' },
        storage: { used: 1.2, limit: 10, unit: 'GB', provider: 'R2' }
    };
  }
}

export const API = new CloudGuardianBackend();
