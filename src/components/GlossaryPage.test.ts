import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import glossary from '../data/glossary.json';
import GlossaryPage from './GlossaryPage.svelte';

const dictionary = (glossaryTitle: string, glossaryIntro: string, backToMicode: string) => ({
  header: { companyName: 'MiCode Sp. z o.o.' },
  blog: { backToMicode },
  glossary: { title: glossaryTitle, intro: glossaryIntro, fullDefinitionLink: 'Full definition →' },
});

beforeAll(() => {
  loadTranslations({
    pl: dictionary('Słownik pojęć', 'Definicje terminów.', '← Powrót do MiCode'),
    en: dictionary('Glossary', 'Term definitions.', '← Back to MiCode'),
    ru: dictionary('Глоссарий', 'Определения терминов.', '← На сайт MiCode'),
  });
});

beforeEach(() => {
  languageStore.set('pl');
});

const alphabetical = [...glossary].sort((a, b) => a.terms[0].localeCompare(b.terms[0]));

describe('GlossaryPage', () => {
  it('renders the localized title and intro', () => {
    render(GlossaryPage);
    expect(screen.getByRole('heading', { level: 1, name: 'Słownik pojęć' })).toBeTruthy();
    expect(screen.getByText('Definicje terminów.')).toBeTruthy();
  });

  it('renders every glossary entry as a heading with a stable id anchor', () => {
    const { container } = render(GlossaryPage);
    for (const entry of glossary) {
      const section = container.querySelector(`#${entry.id}`);
      expect(section, `missing section for "${entry.id}"`).toBeTruthy();
      expect(section?.querySelector('h2')?.textContent).toBe(entry.terms[0]);
    }
  });

  it('orders entries alphabetically by their canonical surface form', () => {
    const { container } = render(GlossaryPage);
    const headings = Array.from(container.querySelectorAll('.glossary-entry h2')).map(
      (el) => el.textContent
    );
    expect(headings).toEqual(alphabetical.map((e) => e.terms[0]));
  });

  it('renders a quick-nav anchor link for every entry', () => {
    const { container } = render(GlossaryPage);
    const links = Array.from(container.querySelectorAll('.glossary-quicknav a'));
    expect(links).toHaveLength(glossary.length);
    for (const entry of glossary) {
      const link = links.find((a) => a.getAttribute('href') === `#${entry.id}`);
      expect(link, `missing quicknav link for "${entry.id}"`).toBeTruthy();
    }
  });

  it('renders definitions in the active language', () => {
    languageStore.set('en');
    const { container } = render(GlossaryPage);
    const ragEntry = glossary.find((e) => e.id === 'rag')!;
    const section = container.querySelector('#rag');
    expect(section?.querySelector('p')?.textContent).toBe(ragEntry.definitionEn);
  });

  it('links back to MiCode', () => {
    render(GlossaryPage);
    const link = screen.getByRole('link', { name: '← Powrót do MiCode' });
    expect(link.getAttribute('href')).toBe('/');
  });
});
