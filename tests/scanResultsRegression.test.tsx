// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScanResults } from '../components/ScanResults';
import { Vulnerability, Severity, ScanStatus } from '../types';

// Mocka o backend para não puxar Firebase/GenAI e devolver um fix determinístico
vi.mock('../services/backend', () => ({
  API: { suggestFix: vi.fn(async () => 'resource "aws_s3_bucket" "x" { acl = "private" }') },
}));

/**
 * Regressão da "tela preta": uma vulnerabilidade vinda da API com `resource`
 * ausente (o banco usa `resourceId`) fazia `f.resource.split('.')` lançar
 * TypeError e derrubar o React. O componente deve renderizar o diff sem crash.
 */
describe('ScanResults — regressão do crash resource/resourceId', () => {
  const findingSemResource = {
    id: 'v1',
    ruleId: 'CKV_AWS_20',
    title: 'Bucket S3 com ACL pública',
    description: 'ACL public-read',
    severity: Severity.CRITICAL,
    status: ScanStatus.OPEN,
    // resource AUSENTE de propósito (shape legado/cru do banco)
  } as unknown as Vulnerability;

  it('renderiza e gera o fix sem lançar mesmo com resource undefined', async () => {
    render(
      <ScanResults
        findings={[findingSemResource]}
        codeContext={'resource "aws_s3_bucket" "x" {\n  acl = "public-read"\n}'}
        onApplyFix={() => {}}
      />
    );

    // Expande o finding (o botão de fix só aparece na seção expandida)
    fireEvent.click(screen.getByText('Bucket S3 com ACL pública'));

    // Dispara o fluxo de IA-fix que renderiza o DiffViewer (o ponto do crash)
    const btn = await screen.findByText(/Gerar Remediação IA/i);
    fireEvent.click(btn);

    // Se o guard não existisse, o .split('.') em resource undefined lançaria
    // durante o render do DiffViewer e este waitFor nunca resolveria.
    await waitFor(() => {
      expect(screen.getByText(/IA Proposed Review/i)).toBeTruthy();
    });
  });
});
