// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest';
import { buildCheckovDockerArgs, checkovImage } from '../services/checkovDocker';

describe('buildCheckovDockerArgs', () => {
  afterEach(() => vi.unstubAllEnvs());

  const args = () => buildCheckovDockerArgs('/tmp/repo', 'bridgecrew/checkov:latest');

  it('monta o comando docker run --rm', () => {
    const a = args();
    expect(a.slice(0, 2)).toEqual(['run', '--rm']);
  });

  it('aplica TODAS as travas de isolamento (repo não confiável)', () => {
    const a = args().join(' ');
    expect(a).toContain('--network none');
    expect(a).toContain('--read-only');
    expect(a).toContain('--security-opt no-new-privileges');
    expect(a).toContain('--cap-drop ALL');
    expect(a).toContain('--pids-limit 512');
    expect(a).toContain('--memory 512m');
    expect(a).toContain('--cpus 1');
  });

  it('monta o código do cliente READ-ONLY em /tf', () => {
    expect(args()).toContain('-v');
    expect(args().join(' ')).toContain('/tmp/repo:/tf:ro');
  });

  it('passa os argumentos do Checkov para saída JSON', () => {
    const a = args().join(' ');
    expect(a).toContain('-d /tf');
    expect(a).toContain('-o json');
    expect(a).toContain('--quiet');
  });

  it('respeita limites de memória/cpu por env', () => {
    vi.stubEnv('CHECKOV_MEMORY', '1g');
    vi.stubEnv('CHECKOV_CPUS', '2');
    const a = buildCheckovDockerArgs('/x', 'img').join(' ');
    expect(a).toContain('--memory 1g');
    expect(a).toContain('--cpus 2');
  });

  it('a imagem é a última antes dos args do checkov e configurável', () => {
    vi.stubEnv('CHECKOV_IMAGE', 'bridgecrew/checkov@sha256:abc');
    expect(checkovImage()).toBe('bridgecrew/checkov@sha256:abc');
    const a = buildCheckovDockerArgs('/x', checkovImage());
    expect(a[a.indexOf('bridgecrew/checkov@sha256:abc') + 1]).toBe('-d');
  });
});
