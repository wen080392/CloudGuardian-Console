
export enum Severity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL"
}

export enum ScanStatus {
  OPEN = "OPEN",
  FIXED = "FIXED",
  IGNORED = "IGNORED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED"
}

export interface Vulnerability {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: Severity;
  status: ScanStatus;
  resource: string;
  line?: number;
  remediation?: string;
  complianceMapping?: string[];
  type?: 'security' | 'finops' | 'best_practice';
  impactScore?: number;
  explorationSteps?: string[];
  resolvedAt?: string;
  containmentLog?: string[];
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  category: 'compute' | 'storage' | 'network' | 'security' | 'identity';
  provider: 'AWS' | 'Azure' | 'GCP';
  region: string;
  status: 'running' | 'stopped' | 'terminated';
  riskScore: number;
  cost: number;
  tags: Record<string, string>;
}

export interface Guardrail {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  logic: string;
  severity: Severity;
  status: 'enabled' | 'disabled';
}

export interface SecurityScore {
  total: number;
  infrastructure: number;
  secrets: number;
  compliance: number;
  drift: number;
  finops: number;
  trend: number;
}

export interface DriftItem {
  id: string;
  resource: string;
  property: string;
  terraformValue: string;
  cloudValue: string;
  severity: Severity;
}

export interface ComplianceControl {
  id: string;
  framework: 'SOC2' | 'ISO27001' | 'HIPAA' | 'PCI-DSS' | 'GDPR' | 'LGPD' | 'CCPA';
  title: string;
  description?: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  score: number;
}

export interface TimelineEvent {
  id: string;
  type: 'SCAN' | 'RISK' | 'PR' | 'COMPLIANCE' | 'DRIFT' | 'PIPELINE' | 'POLICY' | 'FINOPS' | 'ORG' | 'TEST' | 'GLOBAL' | 'INCIDENT' | 'ARCHITECT';
  title: string;
  description: string;
  severity?: Severity;
  timestamp: string;
  metadata?: any;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  framework: string;
  severity: Severity;
  status: 'active' | 'draft';
}

export interface PipelineRun {
  id: string;
  branch: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  vulns: number;
  timestamp: string;
  commit: string;
  prNumber?: number;
}

export interface Project {
  id: string;
  name: string;
  cloud: 'AWS' | 'Azure' | 'GCP';
  region: string;
  status: 'active' | 'archived';
  lastScan: string;
  score: number;
  billingStatus?: 'active' | 'trial' | 'overdue';
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | string;
  lastActive: string;
}

export interface GraphNode {
  id: string;
  data: {
    label: string;
    category: 'compute' | 'storage' | 'network' | 'security' | 'unspecified';
    resource_type: string;
  };
  position: { x: number; y: number };
  status: 'healthy' | 'risk';
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface SecurityTest {
  id: string;
  name: string;
  category: 'unit' | 'sast' | 'dast' | 'pentest';
  status: 'idle' | 'running' | 'passed' | 'failed';
  lastRun?: string;
  coverage: number;
}

export interface ThreatData {
  id: string;
  type: 'Botnet' | 'DDoS' | 'Exploit' | 'Leak';
  region: string;
  intensity: number;
  targets: string[];
  timestamp: string;
}

export type View = 'dashboard' | 'scanner' | 'graph' | 'compliance' | 'drift' | 'settings' | 'automation' | 'report' | 'timeline' | 'sales-playbook' | 'policies' | 'cicd' | 'finops' | 'roadmap' | 'organization' | 'security-tests' | 'war-room' | 'post-mortem' | 'policy-forge' | 'inventory' | 'sentinel' | 'knowledge-base' | 'architect';
