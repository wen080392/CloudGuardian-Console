/**
 * Monta os argumentos do `docker run` para escanear um diretório com o Checkov
 * dentro de uma sandbox isolada. Função pura e testável.
 *
 * Travas de isolamento (o diretório vem de um repositório NÃO confiável):
 *  - `--network none`         : sem acesso de rede a partir do container
 *  - `--read-only`            : filesystem do container imutável
 *  - `-v <dir>:/tf:ro`        : o código do cliente é montado read-only
 *  - `--security-opt no-new-privileges` : impede escalonamento de privilégio
 *  - `--cap-drop ALL`         : remove todas as capabilities do kernel
 *  - `--pids-limit`           : limita fork bombs
 *  - `--memory` / `--cpus`    : limita consumo de recursos
 *  - `--tmpfs /tmp`           : /tmp gravável em memória (o resto é read-only)
 *
 * Symlinks apontando para fora de `/tf` não resolvem: o FS do host não é
 * montado no container, então directory traversal via symlink é inerte.
 */
export function buildCheckovDockerArgs(hostDir: string, image: string): string[] {
  return [
    'run', '--rm',
    '--network', 'none',
    '--read-only',
    '--security-opt', 'no-new-privileges',
    '--cap-drop', 'ALL',
    '--pids-limit', '512',
    '--memory', process.env.CHECKOV_MEMORY || '512m',
    '--cpus', process.env.CHECKOV_CPUS || '1',
    '--tmpfs', '/tmp',
    '-v', `${hostDir}:/tf:ro`,
    image,
    '-d', '/tf', '-o', 'json', '--compact', '--quiet',
  ];
}

export function checkovImage(): string {
  // Em produção, fixe por digest (ex.: bridgecrew/checkov@sha256:...) via CHECKOV_IMAGE
  return process.env.CHECKOV_IMAGE || 'bridgecrew/checkov:latest';
}
