import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import { languageStore } from '../stores/languageStore';
import Certificates from './Certificates.svelte';
import plTranslations from '../data/pl.json';
import enTranslations from '../data/en.json';
import ruTranslations from '../data/ru.json';
import certifications from '../data/certifications.json';

beforeAll(() => {
  loadTranslations({
    pl: plTranslations as Record<string, any>,
    en: enTranslations as Record<string, any>,
    ru: ruTranslations as Record<string, any>,
  });
  languageStore.set('en');
});

afterEach(() => {
  cleanup();
});

describe('Certificates captions', () => {
  it('renders a visible name and issuer caption for every certificate', () => {
    const { getByText, getAllByText } = render(Certificates);

    for (const cert of certifications) {
      expect(getByText(cert.name)).toBeTruthy();
      expect(getAllByText(cert.issuer).length).toBeGreaterThan(0);
    }
  });

  it('labels each thumbnail button with its name and issuer, not a generic index', () => {
    const { getByLabelText, queryByLabelText } = render(Certificates);

    const first = certifications[0];
    expect(getByLabelText(`Open ${first.name} from ${first.issuer}`)).toBeTruthy();
    expect(queryByLabelText('Open certificate 1')).toBeNull();
  });

  it('shows a name/issuer caption overlay in the lightbox when a certificate opens', async () => {
    const { getByLabelText, getByRole } = render(Certificates);
    const first = certifications[0];

    await fireEvent.click(getByLabelText(`Open ${first.name} from ${first.issuer}`));

    const dialog = getByRole('dialog');
    expect(dialog.textContent).toContain(first.name);
    expect(dialog.textContent).toContain(first.issuer);
  });
});
