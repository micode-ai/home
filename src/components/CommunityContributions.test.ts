import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';

vi.mock('../data/community-stats.json', () => ({
  default: {
    fetchedAt: '2026-07-30T00:00:00.000Z',
    stats: {
      'ngx-chat': { githubStars: 12, npmWeeklyDownloads: 53 },
    },
  },
}));

const { default: CommunityContributions } = await import('./CommunityContributions.svelte');

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
  languageStore.set('en');
});

describe('CommunityContributions live stats', () => {
  it('renders GitHub star and npm download badges for the open-source card', () => {
    const { getByLabelText } = render(CommunityContributions);
    expect(getByLabelText('12 GitHub stars')).toBeTruthy();
    expect(getByLabelText('53 weekly npm downloads')).toBeTruthy();
  });

  it('keeps the static blog stat untouched', () => {
    const { getByText } = render(CommunityContributions);
    expect(getByText('400,000+')).toBeTruthy();
  });

  it('renders no stat for the telegram card', () => {
    const { container } = render(CommunityContributions);
    const cards = container.querySelectorAll('.contribution-card');
    const telegramCard = Array.from(cards).find((card) =>
      card.textContent?.includes('Telegram')
    );
    expect(telegramCard).toBeTruthy();
    expect(telegramCard?.querySelector('.stat-badges')).toBeFalsy();
    expect(telegramCard?.querySelector('.contribution-stats')).toBeFalsy();
  });
});
