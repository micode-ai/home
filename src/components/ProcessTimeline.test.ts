import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import ProcessTimeline from './ProcessTimeline.svelte';
import processData from '../data/process-timeline.json';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

beforeAll(() => {
  loadTranslations({
    pl: plTranslations,
    en: enTranslations,
    ru: ruTranslations,
  });
});

afterEach(() => {
  languageStore.set('pl');
});

describe('ProcessTimeline', () => {
  it('renders exactly 5 steps', () => {
    const { container } = render(ProcessTimeline);
    expect(container.querySelectorAll('.process-step')).toHaveLength(5);
    expect(processData).toHaveLength(5);
  });

  it('numbers the steps 1 through 5 in order', () => {
    const { container } = render(ProcessTimeline);
    const numbers = Array.from(container.querySelectorAll('.process-number')).map(
      (el) => el.textContent
    );
    expect(numbers).toEqual(['1', '2', '3', '4', '5']);
  });

  it('renders the section title and localized step copy for each language', () => {
    for (const lang of ['pl', 'en', 'ru'] as const) {
      languageStore.set(lang);
      const { container } = render(ProcessTimeline);
      const translations = translationsFor(lang);

      expect(container.querySelector('.process-title')?.textContent).toBe(
        translations.process.title
      );

      const titles = Array.from(container.querySelectorAll('.process-step-title')).map(
        (el) => el.textContent
      );
      const descriptions = Array.from(
        container.querySelectorAll('.process-step-description')
      ).map((el) => el.textContent);

      expect(titles).toEqual([
        translations.process.step1.title,
        translations.process.step2.title,
        translations.process.step3.title,
        translations.process.step4.title,
        translations.process.step5.title,
      ]);
      expect(descriptions).toEqual([
        translations.process.step1.description,
        translations.process.step2.description,
        translations.process.step3.description,
        translations.process.step4.description,
        translations.process.step5.description,
      ]);
    }
  });

  it('has an accessible, labelled section landmark', () => {
    const { container } = render(ProcessTimeline);
    const section = container.querySelector('section.process');
    expect(section?.getAttribute('aria-labelledby')).toBe('process-title');
    expect(container.querySelector('#process-title')).toBeTruthy();
  });
});

function translationsFor(lang: 'pl' | 'en' | 'ru') {
  return { pl: plTranslations, en: enTranslations, ru: ruTranslations }[lang] as any;
}
