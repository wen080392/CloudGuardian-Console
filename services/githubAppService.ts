import fs from 'fs';

export interface CheckVuln {
  title: string;
  severity: string;
  filePath?: string | null;
  line?: number | null;
  description?: string | null;
  ruleId?: string;
}

export interface CheckRunPayload {
  name: string;
  head_sha: string;
  status: 'completed';
  conclusion: 'success' | 'failure' | 'neutral';
  output: {
    title: string;
    summary: string;
    annotations: Array<{
      path: string;
      start_line: number;
      end_line: number;
      annotation_level: 'failure' | 'warning' | 'notice';
      message: string;
      title: string;
    }>;
  };
}

const levelFor = (severity: string): 'failure' | 'warning' | 'notice' => {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'high') return 'failure';
  if (s === 'medium') return 'warning';
  return 'notice';
};

/**
 * Monta o payload de um Check Run do GitHub a partir do resultado de um scan.
 * Função pura e testável — sem chamadas de rede.
 *
 * GitHub limita a 50 anotações por request; as demais violações entram no
 * resumo. O conclusion é `failure` quando há qualquer violação crítica/alta.
 */
export function buildCheckRunPayload(input: {
  headSha: string;
  engine: string;
  passed: number;
  failed: number;
  vulnerabilities: CheckVuln[];
}): CheckRunPayload {
  const { headSha, engine, passed, failed, vulnerabilities } = input;

  const blocking = vulnerabilities.filter(v => levelFor(v.severity) === 'failure');
  const conclusion: CheckRunPayload['conclusion'] = blocking.length > 0 ? 'failure' : 'success';

  const annotations = vulnerabilities
    .filter(v => v.filePath)
    .slice(0, 50)
    .map(v => {
      const line = v.line && v.line > 0 ? v.line : 1;
      return {
        path: v.filePath as string,
        start_line: line,
        end_line: line,
        annotation_level: levelFor(v.severity),
        message: `${v.ruleId ? v.ruleId + ': ' : ''}${v.description || v.title}`,
        title: `[${v.severity.toUpperCase()}] ${v.title}`,
      };
    });

  const summaryLines = [
    `Engine: \`${engine}\``,
    ``,
    `✅ **${passed}** verificações passaram`,
    `❌ **${failed}** violações encontradas`,
  ];
  if (failed > annotations.length) {
    summaryLines.push('', `> ${failed - annotations.length} violações sem localização de arquivo não anotadas inline.`);
  }

  return {
    name: 'CloudGuardian Security',
    head_sha: headSha,
    status: 'completed',
    conclusion,
    output: {
      title: conclusion === 'failure'
        ? `${blocking.length} violação(ões) crítica(s)/alta(s)`
        : 'Nenhuma violação bloqueante',
      summary: summaryLines.join('\n'),
      annotations,
    },
  };
}

/**
 * Integração com o GitHub App para publicar Check Runs nas PRs.
 * Requer GITHUB_APP_ID + GITHUB_PRIVATE_KEY_PATH.
 */
export class GithubAppService {
  isConfigured(): boolean {
    return !!(process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY_PATH &&
      fs.existsSync(process.env.GITHUB_PRIVATE_KEY_PATH));
  }

  private async getInstallationClient(installationId: number): Promise<any> {
    const { App } = await import('octokit');
    const app = new App({
      appId: process.env.GITHUB_APP_ID as string,
      privateKey: fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH as string, 'utf8'),
    });
    return app.getInstallationOctokit(installationId);
  }

  async postCheckRun(params: {
    installationId: number;
    owner: string;
    repo: string;
    payload: CheckRunPayload;
  }): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('GitHub App não configurado (GITHUB_APP_ID / GITHUB_PRIVATE_KEY_PATH).');
    }
    const octokit = await this.getInstallationClient(params.installationId);
    await octokit.rest.checks.create({
      owner: params.owner,
      repo: params.repo,
      ...params.payload,
    });
  }
}

export const githubAppService = new GithubAppService();
