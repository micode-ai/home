import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { loadTranslations } from '../services/i18n';
import ContactForm from './ContactForm.svelte';
import emailjs from '@emailjs/browser';

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

describe('ContactForm conversion tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    window.history.replaceState(null, '', '/');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
    vi.mocked(emailjs.send).mockReset();
    vi.mocked(emailjs.send).mockResolvedValue({ status: 200, text: 'OK' });
  });

  async function fillAndSubmit() {
    render(ContactForm);
    await fireEvent.input(screen.getByLabelText(/imię/i), { target: { value: 'Anna' } });
    await fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'anna@example.com' } });
    await fireEvent.input(screen.getByLabelText(/wiadomość/i), { target: { value: 'Dzień dobry' } });
    await fireEvent.click(screen.getByLabelText(/wyrażam zgodę/i));
    await fireEvent.click(screen.getByRole('button', { name: /wyślij/i }));
  }

  function eventsNamed(name: string) {
    return vi.mocked(window.gtag!).mock.calls.filter((call) => call[1] === name);
  }

  it('fires generate_lead once the message is delivered', async () => {
    await fillAndSubmit();
    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'generate_lead',
        expect.objectContaining({ form: 'contact' })
      );
    });
  });

  it('tags the delivered form submission with method form', async () => {
    await fillAndSubmit();
    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'generate_lead',
        expect.objectContaining({ form: 'contact', method: 'form' })
      );
    });
  });

  it('reports the delivered message to mktai as a conversion', async () => {
    await fillAndSubmit();
    await waitFor(() => {
      expect(window.mktai).toHaveBeenCalledWith(
        'conversion',
        'generate_lead',
        expect.objectContaining({ form: 'contact' })
      );
    });
  });

  it('fires form_error instead of generate_lead when delivery fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(emailjs.send).mockRejectedValueOnce(new Error('network down'));

    await fillAndSubmit();

    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'form_error',
        expect.objectContaining({ reason: 'send_failed' })
      );
    });
    expect(eventsNamed('generate_lead')).toHaveLength(0);
    consoleError.mockRestore();
  });

  it('fires form_error when validation blocks the submission', async () => {
    render(ContactForm);
    await fireEvent.click(screen.getByRole('button', { name: /wyślij/i }));
    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'form_error',
        expect.objectContaining({ reason: 'validation' })
      );
    });
  });

  it('fires form_start on the first edit only', async () => {
    render(ContactForm);
    const name = screen.getByLabelText(/imię/i);
    await fireEvent.input(name, { target: { value: 'A' } });
    await fireEvent.input(name, { target: { value: 'An' } });
    expect(eventsNamed('form_start')).toHaveLength(1);
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    await fillAndSubmit();
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.mktai).not.toHaveBeenCalled();
  });
});

describe('ContactForm direct-email fallback', () => {
  // The address used to be plain <strong> text: a prospect who read everything
  // and mailed us directly produced no event at all, so the funnel reported a
  // real lead as nothing. Same `generate_lead` name as the form, different
  // `method`, so GA4 needs exactly one key event for both paths.
  const EMAIL = 'development@mi-code.pl';

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cookieConsent', 'accepted');
    window.history.replaceState(null, '', '/');
    window.gtag = vi.fn();
    window.mktai = vi.fn();
  });

  it('renders the address as a mailto link', () => {
    render(ContactForm);
    const link = screen.getByRole('link', { name: new RegExp(EMAIL, 'i') });
    expect(link.getAttribute('href')).toBe(`mailto:${EMAIL}`);
  });

  it('counts a click on it as generate_lead with method email_link', async () => {
    render(ContactForm);
    await fireEvent.click(screen.getByRole('link', { name: new RegExp(EMAIL, 'i') }));
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'generate_lead',
      expect.objectContaining({ method: 'email_link' })
    );
  });

  it('reports the click to mktai as a conversion', async () => {
    render(ContactForm);
    await fireEvent.click(screen.getByRole('link', { name: new RegExp(EMAIL, 'i') }));
    expect(window.mktai).toHaveBeenCalledWith(
      'conversion',
      'generate_lead',
      expect.objectContaining({ method: 'email_link' })
    );
  });

  it('sends nothing when cookies were not accepted', async () => {
    localStorage.setItem('cookieConsent', 'rejected');
    render(ContactForm);
    await fireEvent.click(screen.getByRole('link', { name: new RegExp(EMAIL, 'i') }));
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.mktai).not.toHaveBeenCalled();
  });
});
