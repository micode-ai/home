import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import ShareButtons from './ShareButtons.svelte';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
});

const props = { url: 'https://mi-code.pl/blog/example-post/', title: 'Example Post', lang: 'en' };

describe('ShareButtons links', () => {
  it('builds a LinkedIn share-offsite link with the article URL', () => {
    const { getByLabelText } = render(ShareButtons, { props });
    const link = getByLabelText('Share on LinkedIn') as HTMLAnchorElement;
    expect(link.href).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(props.url)}`
    );
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
    expect(link.rel).toContain('noreferrer');
  });

  it('builds an X/Twitter intent link with the article URL and title', () => {
    const { getByLabelText } = render(ShareButtons, { props });
    const link = getByLabelText('Share on X') as HTMLAnchorElement;
    expect(link.href).toBe(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(props.url)}&text=${encodeURIComponent(props.title)}`
    );
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
  });

  it('renders localized labels for each locale', () => {
    const { getByLabelText: getByLabelTextPl } = render(ShareButtons, { props: { ...props, lang: 'pl' } });
    expect(getByLabelTextPl('Udostępnij na LinkedIn')).toBeTruthy();

    const { getByLabelText: getByLabelTextRu } = render(ShareButtons, { props: { ...props, lang: 'ru' } });
    expect(getByLabelTextRu('Поделиться в LinkedIn')).toBeTruthy();
  });
});

describe('ShareButtons copy-link button', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('copies the given URL and confirms it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { getByTestId } = render(ShareButtons, { props });

    await fireEvent.click(getByTestId('share-copy-button'));

    expect(writeText).toHaveBeenCalledWith(props.url);
    expect(getByTestId('share-copy-button').textContent).toContain('Link copied!');
  });

  it('shows a failure message when copying fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    document.execCommand = vi.fn().mockReturnValue(false);
    const { getByTestId } = render(ShareButtons, { props });

    await fireEvent.click(getByTestId('share-copy-button'));

    expect(getByTestId('share-copy-button').textContent).toMatch(/Couldn't copy/);
  });
});
