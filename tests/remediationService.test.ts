// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { RemediationService } from '../services/remediationService';

function mockOctokit() {
  const calls: Record<string, any[]> = {};
  const track = (name: string, impl: (...args: any[]) => any) =>
    vi.fn((...args: any[]) => {
      (calls[name] ??= []).push(args[0]);
      return impl(...args);
    });

  const octokit = {
    rest: {
      repos: {
        get: track('repos.get', async () => ({ data: { default_branch: 'main' } })),
        getContent: track('repos.getContent', async () => ({
          data: { type: 'file', sha: 'file-sha-123' },
        })),
        createOrUpdateFileContents: track('repos.createOrUpdateFileContents', async () => ({ data: {} })),
      },
      git: {
        getRef: track('git.getRef', async () => ({ data: { object: { sha: 'base-sha-abc' } } })),
        createRef: track('git.createRef', async () => ({ data: {} })),
      },
      pulls: {
        create: track('pulls.create', async () => ({
          data: { html_url: 'https://github.com/acme/infra/pull/42', number: 42 },
        })),
      },
    },
  };
  return { octokit: octokit as any, calls };
}

const input = {
  repoUrl: 'https://github.com/acme/infra',
  filePath: 'main.tf',
  fixedContent: 'resource "aws_s3_bucket" "b" { acl = "private" }',
  vulnerability: {
    id: 'v-1',
    ruleId: 'CKV_AWS_20',
    title: 'Bucket S3 público',
    severity: 'critical',
    description: 'ACL public-read detectada',
  },
};

describe('RemediationService', () => {
  it('cria branch a partir do default branch, commita o fix e abre o PR', async () => {
    const { octokit, calls } = mockOctokit();
    const svc = new RemediationService(octokit);

    const result = await svc.createFixPullRequest(input);

    expect(result.prNumber).toBe(42);
    expect(result.prUrl).toContain('/pull/42');
    expect(result.branch).toMatch(/^cloudguardian\/fix-ckv_aws_20-/);

    expect(calls['git.createRef'][0]).toMatchObject({
      owner: 'acme', repo: 'infra', sha: 'base-sha-abc',
    });
    expect(calls['repos.createOrUpdateFileContents'][0]).toMatchObject({
      owner: 'acme', repo: 'infra', path: 'main.tf', sha: 'file-sha-123',
    });
    const content = Buffer.from(
      calls['repos.createOrUpdateFileContents'][0].content, 'base64'
    ).toString('utf-8');
    expect(content).toBe(input.fixedContent);

    expect(calls['pulls.create'][0]).toMatchObject({ base: 'main' });
    expect(calls['pulls.create'][0].body).toContain('CKV_AWS_20');
  });

  it('rejeita URL de repositório que não é GitHub', async () => {
    const { octokit } = mockOctokit();
    const svc = new RemediationService(octokit);
    await expect(
      svc.createFixPullRequest({ ...input, repoUrl: 'https://gitlab.com/acme/infra' })
    ).rejects.toThrow(/inválida/);
  });

  it('sem GITHUB_TOKEN e sem cliente injetado, falha com erro claro', async () => {
    vi.stubEnv('GITHUB_TOKEN', '');
    const svc = new RemediationService();
    await expect(svc.createFixPullRequest(input)).rejects.toThrow(/GITHUB_TOKEN/);
    vi.unstubAllEnvs();
  });
});
