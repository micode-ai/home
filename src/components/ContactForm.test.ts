import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import ContactForm from './ContactForm.svelte';

vi.mock('@emailjs/browser', () => ({
  default: {
    send: vi.fn().mockResolvedValue({ status: 200 }),
  },
}));

beforeAll(() => {
  loadTranslations({
    pl: {
      contact: {
        title: 'Skontaktuj się',
        name: 'Imię',
        email: 'Email',
        message: 'Wiadomość',
        send: 'Wyślij',
        sending: 'Wysyłanie...',
        success: 'Wysłano!',
        alternativeContact: 'Możesz też napisać na:',
        errors: {
          nameRequired: 'Imię wymagane',
          emailRequired: 'Email wymagany',
          emailInvalid: 'Nieprawidłowy email',
          messageRequired: 'Wiadomość wymagana',
          submitFailed: 'Błąd wysyłania',
        },
      },
      legal: {
        gdprConsent: {
          label: 'Wyrażam zgodę',
          required: 'Wymagana zgoda',
        },
      },
    },
  });
});

describe('ContactForm smoke render', () => {
  it('renders without crashing', () => {
    const { container } = render(ContactForm);
    expect(container).toBeTruthy();
  });

  it('renders a form element', () => {
    const { container } = render(ContactForm);
    expect(container.querySelector('form')).toBeTruthy();
  });

  it('renders a submit button', () => {
    render(ContactForm);
    expect(screen.getByRole('button', { name: /wyślij/i })).toBeTruthy();
  });

  it('renders name, email, and message inputs', () => {
    render(ContactForm);
    expect(screen.getByLabelText(/imię/i)).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/wiadomość/i)).toBeTruthy();
  });
});

describe('ContactForm message prefill from a msg query param', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('leaves the message empty when there is no msg param', () => {
    render(ContactForm);
    expect((screen.getByLabelText(/wiadomość/i) as HTMLTextAreaElement).value).toBe('');
  });

  it('prefills the message from a msg query param', () => {
    window.history.replaceState(null, '', '/?msg=' + encodeURIComponent('Mój koszt agenta: $10-$20/mies.'));
    render(ContactForm);
    expect((screen.getByLabelText(/wiadomość/i) as HTMLTextAreaElement).value).toBe(
      'Mój koszt agenta: $10-$20/mies.'
    );
  });

  it('strips the msg param from the URL after applying it, keeping the hash', () => {
    window.history.replaceState(null, '', '/?msg=hello#contact');
    render(ContactForm);
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('#contact');
  });

  it('preserves other query params while stripping msg', () => {
    window.history.replaceState(null, '', '/?utm_source=newsletter&msg=hello');
    render(ContactForm);
    expect(window.location.search).toBe('?utm_source=newsletter');
  });
});
