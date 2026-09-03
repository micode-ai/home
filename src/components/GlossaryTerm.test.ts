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
    expect(tooltip?.textContent).toContain('A one-sentence explanation.');
  });

  it('links to the term\'s full definition on the standalone glossary page', () => {
    const { container } = setup();
    const link = container.querySelector('.glossary-tooltip-link');
    expect(link?.getAttribute('href')).toBe('/glossary/#rag');
  });

  it('keeps the tooltip in the DOM even when closed (not display:none)', () => {
    const { container } = setup();
    const tooltip = container.querySelector('.glossary-tooltip') as HTMLElement;
    expect(tooltip).toBeTruthy();
    expect(tooltip.classList.contains('visible')).toBe(false);
  });

  // The hover region is the wrapper, not the button: the tooltip carries a link, so it has to
  // survive the pointer travelling off the word and onto it. A browser fires mouseenter on the
  // wrapper as the pointer enters the button inside it, and fires mouseleave on the wrapper only
  // once the pointer has left the button and the tooltip both — these tests dispatch accordingly.
  it('reveals the tooltip on hover and hides it again once the pointer leaves the term', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    const wrap = container.querySelector('.glossary-term-wrap') as HTMLElement;
    await fireEvent.mouseEnter(wrap);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    await fireEvent.mouseLeave(wrap);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('stays open while the pointer moves off the word and onto the tooltip', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    const wrap = container.querySelector('.glossary-term-wrap') as HTMLElement;
    await fireEvent.mouseEnter(wrap);
    // Leaving the word for the tooltip: the button is left, the wrapper is not.
    await fireEvent.mouseLeave(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps the tooltip open when focus moves to the full-definition link', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    const link = container.querySelector('.glossary-tooltip-link') as HTMLElement;
    await fireEvent.focusIn(button);
    await fireEvent.focusOut(button, { relatedTarget: link });
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(true);
  });

  it('closes when focus leaves the term for something outside it', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    const outside = document.createElement('a');
    document.body.appendChild(outside);
    await fireEvent.focusIn(button);
    await fireEvent.focusOut(button, { relatedTarget: outside });
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(false);
    outside.remove();
  });

  it('closes on Escape pressed while focus is inside the tooltip', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    const link = container.querySelector('.glossary-tooltip-link') as HTMLElement;
    await fireEvent.focusIn(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(true);
    await fireEvent.keyDown(link, { key: 'Escape' });
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(false);
  });

  it('reveals the tooltip on keyboard focus', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    await fireEvent.focusIn(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(true);
    await fireEvent.focusOut(button);
    expect(container.querySelector('.glossary-tooltip')?.classList.contains('visible')).toBe(false);
  });

  it('closes on Escape while focused', async () => {
    const { getByRole, container } = setup();
    const button = getByRole('button', { name: 'RAG' });
    await fireEvent.focusIn(button);
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
