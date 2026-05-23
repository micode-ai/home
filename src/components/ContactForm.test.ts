import { describe, it, expect, beforeAll, vi } from 'vitest';
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
