/**
 * Motor de análise nativo do CloudGuardian.
 *
 * Não é uma "simulação": é um conjunto real de regras que fazem parsing leve
 * de blocos `resource` de Terraform (HCL) e avaliam padrões inseguros comuns,
 * alinhados a IDs do Checkov/CIS quando existe correspondência. Serve como
 * engine de baseline quando o Checkov não está disponível — e é sempre
 * rotulado como `native` para que o resultado nunca se passe por Checkov.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface NativeFinding {
  ruleId: string;
  title: string;
  description: string;
  severity: Severity;
  resource: string;
  line: number;
  remediation: string;
  engine: 'native';
}

interface ParsedResource {
  type: string;
  name: string;
  address: string; // "type.name"
  body: string;
  startLine: number;
}

interface Rule {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  remediation: string;
  // Retorna true quando o recurso VIOLA a regra
  appliesTo: (r: ParsedResource) => boolean;
  matches: (r: ParsedResource) => boolean;
}

/**
 * Parser leve de blocos `resource "type" "name" { ... }`.
 * Balanceia chaves para capturar o corpo completo, incluindo blocos aninhados.
 */
export function parseResources(code: string): ParsedResource[] {
  const resources: ParsedResource[] = [];
  const header = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = header.exec(code)) !== null) {
    const type = m[1];
    const name = m[2];
    const bodyStart = header.lastIndex; // logo após o '{'
    let depth = 1;
    let i = bodyStart;
    while (i < code.length && depth > 0) {
      const ch = code[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }
    const body = code.slice(bodyStart, i - 1);
    const startLine = code.slice(0, m.index).split('\n').length;
    resources.push({ type, name, address: `${type}.${name}`, body, startLine });
    header.lastIndex = i;
  }
  return resources;
}

const has = (body: string, re: RegExp) => re.test(body);

const RULES: Rule[] = [
  {
    id: 'CKV_AWS_20',
    title: 'Bucket S3 com ACL pública',
    severity: 'critical',
    description: 'O bucket S3 usa uma ACL pública (public-read/public-read-write), expondo os objetos à internet.',
    remediation: 'Defina acl = "private" ou configure um aws_s3_bucket_public_access_block.',
    appliesTo: r => r.type === 'aws_s3_bucket',
    matches: r => has(r.body, /acl\s*=\s*"(public-read|public-read-write)"/),
  },
  {
    id: 'CKV_AWS_18',
    title: 'Bucket S3 sem logging de acesso',
    severity: 'low',
    description: 'O bucket S3 não define logging de acesso, dificultando auditoria e investigação de incidentes.',
    remediation: 'Adicione um bloco logging { target_bucket = ... } ao recurso.',
    appliesTo: r => r.type === 'aws_s3_bucket',
    matches: r => !has(r.body, /logging\s*\{/),
  },
  {
    id: 'CKV_AWS_24',
    title: 'Porta SSH (22) aberta para a internet',
    severity: 'high',
    description: 'Regra de ingress permite tráfego de 0.0.0.0/0 para a porta 22 (SSH), expondo o host a toda a internet.',
    remediation: 'Restrinja cidr_blocks a faixas conhecidas (VPN/escritório) ou use um bastion host.',
    appliesTo: r => r.type === 'aws_security_group' || r.type === 'aws_security_group_rule',
    matches: r =>
      has(r.body, /from_port\s*=\s*22\b/) &&
      has(r.body, /cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"/),
  },
  {
    id: 'CKV_AWS_25',
    title: 'Porta RDP (3389) aberta para a internet',
    severity: 'high',
    description: 'Regra de ingress permite tráfego de 0.0.0.0/0 para a porta 3389 (RDP).',
    remediation: 'Restrinja cidr_blocks a faixas confiáveis; nunca exponha RDP à internet.',
    appliesTo: r => r.type === 'aws_security_group' || r.type === 'aws_security_group_rule',
    matches: r =>
      has(r.body, /from_port\s*=\s*3389\b/) &&
      has(r.body, /cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"/),
  },
  {
    id: 'CKV_AWS_16',
    title: 'Instância RDS sem criptografia em repouso',
    severity: 'high',
    description: 'A instância RDS não habilita storage_encrypted, deixando os dados sem criptografia em repouso.',
    remediation: 'Defina storage_encrypted = true na aws_db_instance.',
    appliesTo: r => r.type === 'aws_db_instance',
    matches: r => !has(r.body, /storage_encrypted\s*=\s*true/),
  },
  {
    id: 'CKV_AWS_17',
    title: 'Instância RDS publicamente acessível',
    severity: 'critical',
    description: 'A instância RDS define publicly_accessible = true, expondo o banco de dados à internet.',
    remediation: 'Defina publicly_accessible = false e use subnets privadas.',
    appliesTo: r => r.type === 'aws_db_instance',
    matches: r => has(r.body, /publicly_accessible\s*=\s*true/),
  },
  {
    id: 'CKV_AWS_23',
    title: 'Volume EBS sem criptografia',
    severity: 'medium',
    description: 'O volume EBS não define encrypted = true.',
    remediation: 'Defina encrypted = true no aws_ebs_volume.',
    appliesTo: r => r.type === 'aws_ebs_volume',
    matches: r => !has(r.body, /encrypted\s*=\s*true/),
  },
  {
    id: 'CKV_AWS_40',
    title: 'Credenciais IAM em texto no código',
    severity: 'critical',
    description: 'Chave de acesso AWS aparentemente hardcoded no código (AKIA...).',
    remediation: 'Remova segredos do IaC; use variáveis, KMS ou um secret manager.',
    appliesTo: () => true,
    matches: r => has(r.body, /AKIA[0-9A-Z]{16}/),
  },
  {
    id: 'CKV_AWS_260',
    title: 'ALB/ELB com listener HTTP sem TLS',
    severity: 'medium',
    description: 'Listener usa protocolo HTTP em vez de HTTPS, trafegando dados sem criptografia.',
    remediation: 'Use protocol = "HTTPS" com um certificado TLS.',
    appliesTo: r => r.type === 'aws_lb_listener',
    matches: r => has(r.body, /protocol\s*=\s*"HTTP"/),
  },
];

export interface NativeScanResult {
  engine: 'native';
  findings: NativeFinding[];
  passed: number;
  failed: number;
}

export function scanTerraformNative(code: string): NativeScanResult {
  const resources = parseResources(code);
  const findings: NativeFinding[] = [];
  let passed = 0;

  for (const resource of resources) {
    for (const rule of RULES) {
      if (!rule.appliesTo(resource)) continue;
      if (rule.matches(resource)) {
        findings.push({
          ruleId: rule.id,
          title: rule.title,
          description: rule.description,
          severity: rule.severity,
          resource: resource.address,
          line: resource.startLine,
          remediation: rule.remediation,
          engine: 'native',
        });
      } else {
        passed++;
      }
    }
  }

  return { engine: 'native', findings, passed, failed: findings.length };
}

export const NATIVE_RULE_COUNT = RULES.length;
