// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { scanTerraformNative, parseResources } from '../services/nativeEngine';

describe('parseResources', () => {
  it('captura corpo com blocos aninhados balanceando chaves', () => {
    const code = `
resource "aws_security_group" "web" {
  ingress {
    from_port = 22
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_s3_bucket" "b" {
  acl = "private"
}`;
    const parsed = parseResources(code);
    expect(parsed.map(r => r.address)).toEqual(['aws_security_group.web', 'aws_s3_bucket.b']);
    expect(parsed[0].body).toContain('from_port = 22');
    expect(parsed[1].body).toContain('acl = "private"');
  });
});

describe('scanTerraformNative', () => {
  it('detecta bucket S3 com ACL pública (CKV_AWS_20, critical)', () => {
    const { findings } = scanTerraformNative(`
resource "aws_s3_bucket" "assets" {
  acl = "public-read"
  logging { target_bucket = "logs" }
}`);
    const f = findings.find(f => f.ruleId === 'CKV_AWS_20');
    expect(f).toBeDefined();
    expect(f!.severity).toBe('critical');
    expect(f!.resource).toBe('aws_s3_bucket.assets');
    expect(f!.engine).toBe('native');
  });

  it('detecta SSH aberto para o mundo (CKV_AWS_24, high)', () => {
    const { findings } = scanTerraformNative(`
resource "aws_security_group" "ssh" {
  ingress {
    from_port = 22
    to_port = 22
    cidr_blocks = ["0.0.0.0/0"]
  }
}`);
    expect(findings.some(f => f.ruleId === 'CKV_AWS_24' && f.severity === 'high')).toBe(true);
  });

  it('detecta RDS público e sem criptografia', () => {
    const { findings } = scanTerraformNative(`
resource "aws_db_instance" "main" {
  publicly_accessible = true
}`);
    const ids = findings.map(f => f.ruleId);
    expect(ids).toContain('CKV_AWS_17'); // público (critical)
    expect(ids).toContain('CKV_AWS_16'); // sem storage_encrypted
  });

  it('detecta chave de acesso AWS hardcoded (CKV_AWS_40, critical)', () => {
    const { findings } = scanTerraformNative(`
resource "aws_instance" "web" {
  user_data = "export AWS_KEY=AKIAIOSFODNN7EXAMPLE"
}`);
    expect(findings.some(f => f.ruleId === 'CKV_AWS_40' && f.severity === 'critical')).toBe(true);
  });

  it('NÃO acusa recurso seguro (sem falsos positivos nas regras críticas)', () => {
    const { findings } = scanTerraformNative(`
resource "aws_s3_bucket" "secure" {
  acl = "private"
  logging { target_bucket = "logs" }
}
resource "aws_db_instance" "secure" {
  publicly_accessible = false
  storage_encrypted   = true
}`);
    const critical = findings.filter(f => f.severity === 'critical');
    expect(critical).toHaveLength(0);
  });

  it('reporta contagens de passed/failed coerentes', () => {
    const res = scanTerraformNative(`
resource "aws_s3_bucket" "b" {
  acl = "public-read"
}`);
    expect(res.failed).toBe(res.findings.length);
    expect(res.failed).toBeGreaterThan(0);
    expect(res.engine).toBe('native');
  });
});
