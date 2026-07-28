import { Octokit } from 'octokit';

export interface RemediationInput {
  repoUrl: string;          // ex.: https://github.com/acme/infra
  filePath: string;         // caminho do arquivo a corrigir no repo
  fixedContent: string;     // conteúdo completo corrigido do arquivo
  vulnerability: {
    id: string;
    ruleId: string;
    title: string;
    severity: string;
    description?: string | null;
  };
}

export interface RemediationResult {
  prUrl: string;
  prNumber: number;
  branch: string;
}

function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!match) throw new Error(`URL de repositório inválida: ${repoUrl}`);
  return { owner: match[1], repo: match[2] };
}

/**
 * Auto-remediação (MVP): abre um pull request no repositório do cliente com
 * a correção proposta para uma vulnerabilidade.
 *
 * Fluxo: branch a partir do default branch → commit do arquivo corrigido →
 * PR com contexto da vulnerabilidade. O Octokit é injetável para testes.
 */
export class RemediationService {
  constructor(private octokit?: Octokit) {}

  private getClient(): Octokit {
    if (this.octokit) return this.octokit;
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN não configurado — auto-remediação indisponível.');
    }
    return new Octokit({ auth: token });
  }

  async createFixPullRequest(input: RemediationInput): Promise<RemediationResult> {
    const { owner, repo } = parseRepoUrl(input.repoUrl);
    const octokit = this.getClient();
    const { vulnerability } = input;

    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const baseBranch = repoData.default_branch;

    const { data: baseRef } = await octokit.rest.git.getRef({
      owner, repo, ref: `heads/${baseBranch}`,
    });

    const branch = `cloudguardian/fix-${vulnerability.ruleId.toLowerCase()}-${Date.now()}`;
    await octokit.rest.git.createRef({
      owner, repo,
      ref: `refs/heads/${branch}`,
      sha: baseRef.object.sha,
    });

    // sha do arquivo é necessário para atualizar um arquivo existente
    let existingSha: string | undefined;
    try {
      const { data: existing } = await octokit.rest.repos.getContent({
        owner, repo, path: input.filePath, ref: branch,
      });
      if (!Array.isArray(existing) && existing.type === 'file') {
        existingSha = existing.sha;
      }
    } catch {
      // Arquivo não existe ainda — será criado
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, branch,
      path: input.filePath,
      message: `fix(security): ${vulnerability.title} [${vulnerability.ruleId}]`,
      content: Buffer.from(input.fixedContent, 'utf-8').toString('base64'),
      sha: existingSha,
    });

    const body = [
      `## 🛡️ CloudGuardian — Correção automática`,
      ``,
      `| | |`,
      `|---|---|`,
      `| **Vulnerabilidade** | ${vulnerability.title} |`,
      `| **Regra** | \`${vulnerability.ruleId}\` |`,
      `| **Severidade** | ${vulnerability.severity.toUpperCase()} |`,
      `| **Arquivo** | \`${input.filePath}\` |`,
      ``,
      vulnerability.description ? `${vulnerability.description}\n` : '',
      `> PR gerado automaticamente pelo CloudGuardian. Revise antes de mergear.`,
    ].join('\n');

    const { data: pr } = await octokit.rest.pulls.create({
      owner, repo,
      title: `🛡️ Fix: ${vulnerability.title}`,
      head: branch,
      base: baseBranch,
      body,
    });

    return { prUrl: pr.html_url, prNumber: pr.number, branch };
  }
}

export const remediationService = new RemediationService();
