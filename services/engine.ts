
import { Vulnerability, Severity, ScanStatus, ComplianceControl, GraphNode, GraphEdge, DriftItem, SecurityScore } from '../types';

export const calculateSecurityScore = (findings: Vulnerability[], drifts: DriftItem[]): SecurityScore => {
  let infraBase = 100;
  let secretBase = 100;
  let driftBase = 100;
  let finopsBase = 100;

  findings.forEach(f => {
    const penalty = f.severity === Severity.CRITICAL ? 25 : f.severity === Severity.HIGH ? 15 : 5;
    if (f.ruleId.includes('SECRET')) secretBase -= penalty;
    else if (f.type === 'finops') finopsBase -= penalty;
    else infraBase -= penalty;
  });

  drifts.forEach(d => {
    const penalty = d.severity === Severity.CRITICAL ? 20 : 10;
    driftBase -= penalty;
  });

  infraBase = Math.max(0, infraBase);
  secretBase = Math.max(0, secretBase);
  driftBase = Math.max(0, driftBase);
  finopsBase = Math.max(0, finopsBase);
  
  const complianceBase = Math.round((infraBase + secretBase + driftBase) / 3);
  const total = Math.round((infraBase * 0.3) + (secretBase * 0.2) + (driftBase * 0.2) + (complianceBase * 0.1) + (finopsBase * 0.2));

  return {
    total,
    infrastructure: infraBase,
    secrets: secretBase,
    compliance: complianceBase,
    drift: driftBase,
    finops: finopsBase,
    trend: total > 70 ? +1.2 : -0.5
  };
};

export const scanForFinOps = (content: string): Vulnerability[] => {
    const findings: Vulnerability[] = [];
    if (content.includes('t2.large') || content.includes('t3.xlarge')) {
        findings.push({
            id: `fin-${Date.now()}-size`,
            ruleId: 'COST_OPTIMIZATION_SIZE',
            title: 'FinOps: Overprovisioned Instance',
            description: 'A instância selecionada pode ser substituída por uma t3.medium economizando até $40/mês.',
            severity: Severity.LOW,
            status: ScanStatus.OPEN,
            resource: 'aws_instance.app_server',
            type: 'finops',
            remediation: 'Utilize instâncias de família T3 ou instâncias Spot para workloads não críticos.'
        });
    }
    return findings;
};

// --- New Engine Function: Misconfiguration Scanner ---
export const scanForMisconfigurations = (content: string): Vulnerability[] => {
    const findings: Vulnerability[] = [];
    
    const checks = [
        { pattern: /protocol\s*=\s*"http"/i, id: 'UNENCRYPTED_HTTP', title: 'Insecure Protocol (HTTP)', severity: Severity.HIGH, desc: 'Uso de protocolo não criptografado detectado.' },
        { pattern: /ssl_policy\s*=\s*"ELBSecurityPolicy-2016-08"/i, id: 'WEAK_SSL', title: 'Weak SSL Policy', severity: Severity.MEDIUM, desc: 'Política SSL depreciada. Use TLS 1.2+.' },
        { pattern: /publicly_accessible\s*=\s*true/, id: 'PUBLIC_DB', title: 'Public Database Exposed', severity: Severity.CRITICAL, desc: 'RDS/Database exposto publicamente.' },
        { pattern: /0.0.0.0\/0/, id: 'OPEN_CIDR', title: 'Unrestricted Network Access', severity: Severity.HIGH, desc: 'Security Group aberto para o mundo (0.0.0.0/0).' }
    ];

    content.split('\n').forEach((line, index) => {
        checks.forEach(check => {
            if (line.match(check.pattern)) {
                findings.push({
                    id: `misconf-${index}-${check.id}`,
                    ruleId: check.id,
                    title: check.title,
                    description: check.desc,
                    severity: check.severity,
                    status: ScanStatus.OPEN,
                    resource: 'terraform.tf',
                    line: index + 1,
                    remediation: 'Restrinja o acesso ou force criptografia (HTTPS/TLS 1.2).',
                    complianceMapping: ['SOC2_CC6.6']
                });
            }
        });
    });
    
    return findings;
};

export const scanForSecrets = (content: string): Vulnerability[] => {
    const findings: Vulnerability[] = [];
    const patterns = [
        { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/, id: 'AWS_ACCESS_KEY', severity: Severity.CRITICAL },
        { name: 'AWS Secret Key', regex: /(aws_secret_access_key|secret_key)\s*=\s*["']([a-zA-Z0-9/+]{40})["']/, id: 'AWS_SECRET_KEY', severity: Severity.CRITICAL },
        { name: 'RSA Private Key', regex: /-----BEGIN RSA PRIVATE KEY-----/, id: 'RSA_PRIVATE_KEY', severity: Severity.CRITICAL },
        { name: 'GitHub Personal Token', regex: /ghp_[a-zA-Z0-9]{36}/, id: 'GITHUB_TOKEN', severity: Severity.HIGH },
        { name: 'Slack Bot Token', regex: /xoxb-[a-zA-Z0-9-]{10,}/, id: 'SLACK_TOKEN', severity: Severity.HIGH },
        { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/, id: 'GOOGLE_API_KEY', severity: Severity.HIGH },
        { name: 'Generic API Key', regex: /(api_key|apikey|auth_token)\s*=\s*["'][a-zA-Z0-9-_]{20,}["']/, id: 'GENERIC_API_KEY', severity: Severity.MEDIUM }
    ];

    content.split('\n').forEach((line, index) => {
        patterns.forEach(p => {
            if (line.match(p.regex)) {
                 findings.push({
                    id: `secret-${index}-${p.id}`,
                    ruleId: p.id,
                    title: `Critical Secret: ${p.name}`,
                    description: `Credencial de alta entropia detectada em texto claro. Risco extremo de comprometimento total.`,
                    severity: p.severity,
                    status: ScanStatus.OPEN,
                    resource: 'terraform.tf',
                    line: index + 1,
                    remediation: 'Mova imediatamente para um Vault (AWS Secrets Manager ou HashiCorp Vault) e rotacione a chave.',
                    complianceMapping: ['SOC2_CC6.1', 'ISO27001_A.10']
                 });
            }
        });
    });
    
    // Merge with misconfigurations for a full rigorous scan
    return [...findings, ...scanForMisconfigurations(content)];
};

export const parseHclToGraph = (hcl: string): { nodes: GraphNode[]; edges: GraphEdge[] } => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    // Virtual Internet Node check
    const hasPublicExposure = hcl.includes('0.0.0.0/0') || hcl.includes('public-read');
    if (hasPublicExposure) {
        nodes.push({
            id: 'THE_INTERNET',
            data: { label: 'INTERNET', category: 'network', resource_type: 'public_world' },
            position: { x: 0, y: 0 },
            status: 'healthy'
        });
    }

    const resourceRegex = /resource\s+"([\w_]+)"\s+"([\w_-]+)"\s*{([\s\S]*?)}/g;
    let match;
    let x = 300; let y = 100; // Offset for Internet node

    while ((match = resourceRegex.exec(hcl)) !== null) {
        const [fullBlock, type, name, content] = match;
        const id = `${type}.${name}`;
        
        let category: GraphNode['data']['category'] = 'compute';
        if (type.includes('s3') || type.includes('db') || type.includes('rds')) category = 'storage';
        else if (type.includes('vpc') || type.includes('network') || type.includes('subnet') || type.includes('gateway')) category = 'network';
        else if (type.includes('security') || type.includes('iam') || type.includes('kms')) category = 'security';
        
        nodes.push({ 
          id, 
          data: { label: name, category, resource_type: type }, 
          position: { x, y }, 
          status: 'healthy' 
        });

        // Detect connection to Internet
        if (hasPublicExposure && (content.includes('0.0.0.0/0') || content.includes('public-read'))) {
            edges.push({
                id: `edge-internet-${id}`,
                source: 'THE_INTERNET',
                target: id,
                animated: true
            });
        }

        x += 240; if (x > 800) { x = 300; y += 180; }
    }
    
    // Inter-resource connections
    nodes.forEach(node => {
        if (node.id === 'THE_INTERNET') return;
        const blockMatch = hcl.match(new RegExp(`resource\\s+"${node.data.resource_type}"\\s+"${node.data.label}"\\s*{([\\s\\S]*?)}`));
        if (blockMatch) {
            const blockContent = blockMatch[1];
            nodes.forEach(target => {
                if (node.id === target.id || target.id === 'THE_INTERNET') return;
                
                // Matches implicit dependencies or explicit ID references
                if (blockContent.includes(target.id) || 
                    blockContent.includes(`${target.data.resource_type}.${target.data.label}`) || 
                    blockContent.includes(target.data.label)) {
                    
                    edges.push({
                        id: `edge-${node.id}-${target.id}`,
                        source: node.id,
                        target: target.id,
                        animated: true
                    });
                }
            });
        }
    });

    return { nodes, edges };
};

export const calculateAttackPaths = (nodes: GraphNode[], edges: GraphEdge[]): { id: string, name: string, path: string[], severity: Severity }[] => {
    // Logic: Find paths from THE_INTERNET -> ... -> Storage/Database
    const paths: { id: string, name: string, path: string[], severity: Severity }[] = [];
    const internetNode = nodes.find(n => n.id === 'THE_INTERNET');
    
    if (!internetNode) return [];

    const criticalTargets = nodes.filter(n => n.data.category === 'storage'); // DBs, S3

    criticalTargets.forEach(target => {
        // Simple BFS for pathfinding
        const queue: { current: string, path: string[] }[] = [{ current: internetNode.id, path: [internetNode.id] }];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const { current, path } = queue.shift()!;
            if (current === target.id) {
                // Path found!
                paths.push({
                    id: `path-${target.id}`,
                    name: `Public Exposure: ${target.data.label}`,
                    path: path,
                    severity: Severity.CRITICAL
                });
                break; // One path is enough for demo
            }

            visited.add(current);
            const neighbors = edges.filter(e => e.source === current).map(e => e.target);
            
            neighbors.forEach(n => {
                if (!visited.has(n)) {
                    queue.push({ current: n, path: [...path, n] });
                }
            });
        }
    });

    return paths;
};

export const CONTROL_REGISTRY: Record<string, Omit<ComplianceControl, 'score' | 'status'>> = {
    'SOC2_CC6.1': { id: 'SOC2_CC6.1', framework: 'SOC2', title: 'Acesso Lógico e Segregação' },
    'SOC2_CC6.6': { id: 'SOC2_CC6.6', framework: 'SOC2', title: 'Segurança de Rede de Perímetro' },
    'ISO27001_A.10': { id: 'ISO27001_A.10', framework: 'ISO27001', title: 'Criptografia de Dados' }
};

export const getComplianceReport = (findings: Vulnerability[]): ComplianceControl[] => {
    const report: Record<string, ComplianceControl> = {};
    Object.values(CONTROL_REGISTRY).forEach(ctrl => {
        report[ctrl.id] = { ...ctrl, status: 'PASS', score: 100 };
    });
    findings.forEach(v => {
        (v.complianceMapping || []).forEach(cid => {
            if (report[cid]) { report[cid].status = 'FAIL'; report[cid].score = 0; }
        });
    });
    return Object.values(report);
};
