import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import GlossaryTerm from './GlossaryTerm.svelte';

function setup() {
  return render(GlossaryTerm, {
    props: { termId: 'rag', text: 'RAG', definition: 'A one-sentence explanation.' },
  });
}

describe('GlossaryTerm', () => {
  it('renders the term text as a button', () => {
    const { getByRole } = setup();
    expect(getByRole('button', { name: 'RAG' })).toBeTruthy();
  });

  it('links the button to its tooltip via aria-describedby, deterministic from termId', () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    const describedBy = button.getAttribute('aria-describedby');
    expect(describedBy).toBe('glossary-tip-rag');
    const tooltip = container.querySelector(`#${describedBy}`);
    expect(tooltip?.textContent).toBe('A one-sentence explanation.');
  });

  it('keeps the tooltip in the DOM even when closed (not display:none)', () => {
    const { container } = setup();
    const tooltip = container.querySelector('.glossary-tooltip') as HTMLElement;
    expect(tooltip).toBeTruthy();
    expect(tooltip.classList.contains('visible')).toBe(false);
  });

  it('reveals the tooltip on hover and hides it again on mouse leave', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    await fireEvent.mouseEnter(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    await fireEvent.mouseLeave(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('reveals the tooltip on keyboard focus', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    await fireEvent.focus(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(true);
    await fireEvent.blur(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(false);
  });

  it('closes on Escape while focused', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    await fireEvent.focus(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(true);
    await fireEvent.keyDown(button, { key: 'Escape' });
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(false);
  });

  it('toggles open/closed on click (tap support)', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    await fireEvent.click(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(true);
    await fireEvent.click(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(false);
  });
});
