// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DiffViewer } from '../components/DiffViewer';

/**
 * Regressão: o diff de código precisa ser marcado com translate="no". Sem isso,
 * extensões de tradução do navegador reescrevem os nós de texto e quebram a
 * reconciliação do React ("Failed to execute 'insertBefore'...") ao aplicar um
 * fix no Terraform.
 */
describe('DiffViewer — proteção contra tradução do navegador', () => {
  it('marca o container com translate="no"/notranslate', () => {
    const { container } = render(
      <DiffViewer original={'resource "x" {}'} fixed={'resource "x" { encrypted = true }'} />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('translate')).toBe('no');
    expect(root.className).toContain('notranslate');
  });
});
