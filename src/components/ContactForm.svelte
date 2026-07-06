<script lang="ts">
  import emailjs from '@emailjs/browser';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { validateForm, type FormData } from '../services/validation';

  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  let formData = $state<FormData>({
    name: '',
    email: '',
    message: ''
  });

  let errors = $state<Partial<Record<keyof FormData, string>>>({});
  let gdprConsent = $state(false);
  let gdprConsentError = $state('');
  let isSubmitted = $state(false);
  let isSubmitting = $state(false);
  let submitError = $state(false);
  let touched = $state<Partial<Record<keyof FormData, boolean>>>({});

  function dismissSuccess() {
    isSubmitted = false;
  }

  function handleBlur(field: keyof FormData) {
    touched[field] = true;
    validateField(field);
  }

  function validateField(field: keyof FormData) {
    if (!touched[field]) return;

    const translations = {
      nameRequired: t('contact.errors.nameRequired', $languageStore),
      emailRequired: t('contact.errors.emailRequired', $languageStore),
      emailInvalid: t('contact.errors.emailInvalid', $languageStore),
      messageRequired: t('contact.errors.messageRequired', $languageStore)
    };

    const allErrors = validateForm(formData, translations);

    if (allErrors[field]) {
      errors[field] = allErrors[field];
    } else {
      delete errors[field];
    }
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    touched = { name: true, email: true, message: true };

    const translations = {
      nameRequired: t('contact.errors.nameRequired', $languageStore),
      emailRequired: t('contact.errors.emailRequired', $languageStore),
      emailInvalid: t('contact.errors.emailInvalid', $languageStore),
      messageRequired: t('contact.errors.messageRequired', $languageStore)
    };

    errors = validateForm(formData, translations);

    if (!gdprConsent) {
      gdprConsentError = t('legal.gdprConsent.required', $languageStore);
    } else {
      gdprConsentError = '';
    }

    if (Object.keys(errors).length === 0 && gdprConsent) {
      isSubmitting = true;
      submitError = false;

      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            from_name: formData.name,
            from_email: formData.email,
            message: formData.message,
          },
          EMAILJS_PUBLIC_KEY
        );

        isSubmitted = true;
        formData = { name: '', email: '', message: '' };
        touched = {};
      } catch (err) {
        console.error('EmailJS error:', err);
        submitError = true;
      } finally {
        isSubmitting = false;
      }
    }
  }
</script>

<section class="contact-section scroll-reveal" id="contact" aria-labelledby="contact-title">
  <div class="contact-container">
    <div class="contact-form">
      <h2 id="contact-title" class="contact-title">{t('contact.title', $languageStore)}</h2>
      <p class="response-promise">{t('contact.responsePromise', $languageStore)}</p>

      {#if isSubmitted}
        <div class="success-message" role="alert" aria-live="polite">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          <span>{t('contact.success', $languageStore)}<br>{t('contact.responsePromise', $languageStore)}</span>
          <button
            type="button"
            class="success-dismiss"
            onclick={dismissSuccess}
            aria-label={t('legal.privacyPolicy.close', $languageStore)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      {/if}

      {#if submitError}
        <div class="error-banner" role="alert" aria-live="polite">
          {t('contact.errors.submitFailed', $languageStore)}
        </div>
      {/if}

      <form onsubmit={handleSubmit} novalidate aria-label="Contact form">
        <div class="form-group">
          <label for="name">{t('contact.name', $languageStore)}</label>
          <input
            type="text"
            id="name"
            name="name"
            autocomplete="name"
            bind:value={formData.name}
            onblur={() => handleBlur('name')}
            oninput={() => validateField('name')}
            class:error={errors.name}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-required="true"
          />
          {#if errors.name}
            <span class="error-message" id="name-error" role="alert">{errors.name}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="email">{t('contact.email', $languageStore)}</label>
          <input
            type="email"
            id="email"
            name="email"
            autocomplete="email"
            bind:value={formData.email}
            onblur={() => handleBlur('email')}
            oninput={() => validateField('email')}
            class:error={errors.email}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-required="true"
          />
          {#if errors.email}
            <span class="error-message" id="email-error" role="alert">{errors.email}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="message">{t('contact.message', $languageStore)}</label>
          <textarea
            id="message"
            name="message"
            bind:value={formData.message}
            onblur={() => handleBlur('message')}
            oninput={() => validateField('message')}
            rows="5"
            class:error={errors.message}
            aria-invalid={errors.message ? 'true' : 'false'}
            aria-describedby={errors.message ? 'message-error' : undefined}
            aria-required="true"
          ></textarea>
          {#if errors.message}
            <span class="error-message" id="message-error" role="alert">{errors.message}</span>
          {/if}
        </div>

        <div class="form-group gdpr-group">
          <label class="gdpr-label">
            <input
              type="checkbox"
              id="gdpr-consent"
              bind:checked={gdprConsent}
              class:error={gdprConsentError}
              aria-invalid={gdprConsentError ? 'true' : 'false'}
              aria-describedby={gdprConsentError ? 'gdpr-error' : undefined}
              aria-required="true"
            />
            <span class="gdpr-text">
              {t('legal.gdprConsent.label', $languageStore)}
            </span>
          </label>
          {#if gdprConsentError}
            <span class="error-message" id="gdpr-error" role="alert">{gdprConsentError}</span>
          {/if}
        </div>

        <button type="submit" class="submit-button" disabled={isSubmitting} aria-label="{t('contact.send', $languageStore)}">
          {#if isSubmitting}
            {t('contact.sending', $languageStore)}
          {:else}
            {t('contact.send', $languageStore)}
          {/if}
        </button>
      </form>

      <div class="alternative-contact" role="complementary" aria-label="Alternative contact information">
        <p>{t('contact.alternativeContact', $languageStore)}</p>
        <p><strong>development@mi-code.pl</strong></p>
      </div>
    </div>
  </div>
</section>

<style>
  .contact-section {
    background: var(--color-bg-tertiary);
    padding: var(--section-padding);
  }

  .contact-container {
    max-width: var(--max-width-xl);
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: center;
  }

  .contact-form {
    max-width: 600px;
    width: 100%;
    background: var(--color-bg-primary);
    padding: 2.5rem;
    border-radius: var(--radius-2xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
  }

  .contact-title {
    margin: 0 0 1.5rem 0;
    font-family: var(--font-heading);
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .success-message {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
    padding: 1rem 2.75rem 1rem 1rem;
    border-radius: var(--radius-lg);
    margin-bottom: 1.5rem;
    text-align: center;
    font-weight: 500;
  }

  .success-dismiss {
    position: absolute;
    top: 0.375rem;
    right: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: #065f46;
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .success-dismiss:hover {
    background: rgba(6, 95, 70, 0.1);
  }

  .success-dismiss:focus-visible {
    outline: 2px solid #065f46;
    outline-offset: 2px;
  }

  .response-promise {
    margin: -0.75rem 0 1.25rem 0;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    text-align: center;
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    padding: 1rem;
    border-radius: var(--radius-lg);
    margin-bottom: 1.5rem;
    text-align: center;
    font-weight: 500;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  input,
  textarea {
    padding: 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-size: 1rem;
    font-family: inherit;
    transition: border-color var(--transition-base), box-shadow var(--transition-base);
    color: var(--color-text-primary);
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }

  input.error,
  textarea.error {
    border-color: var(--color-error);
  }

  .error-message {
    color: var(--color-error);
    font-size: 0.8125rem;
  }

  .gdpr-group {
    gap: 0.5rem;
  }

  .gdpr-label {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    cursor: pointer;
    font-weight: normal;
  }

  .gdpr-label input[type="checkbox"] {
    flex-shrink: 0;
    margin-top: 0.2rem;
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: var(--color-accent);
  }

  .gdpr-label input[type="checkbox"].error {
    outline: 2px solid var(--color-error);
    outline-offset: 1px;
  }

  .gdpr-text {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .submit-button {
    padding: 0.75rem 2rem;
    background: var(--color-accent);
    color: #ffffff;
    border: none;
    border-radius: var(--radius-full);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-base), transform var(--transition-base);
    min-height: 44px;
    min-width: 44px;
  }

  .submit-button:hover {
    background: var(--color-accent-dark);
    transform: translateY(-1px);
  }

  .submit-button:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .alternative-contact {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 0.9375rem;
  }

  .alternative-contact p {
    margin: 0.375rem 0;
  }

  .alternative-contact strong {
    color: var(--color-text-primary);
  }

  @media (max-width: 767px) {
    .contact-container {
      padding: 0 1rem;
    }

    .contact-form {
      padding: 1.5rem;
    }

    .contact-title {
      font-size: 1.5rem;
    }

    .submit-button {
      width: 100%;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .contact-container {
      padding: 0 1.5rem;
    }

    .contact-form {
      padding: 2rem;
    }

    .contact-title {
      font-size: 1.75rem;
    }
  }

  :global(html.dark-mode-active) .contact-form {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
  }

  :global(html.dark-mode-active) .success-message {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }

  :global(html.dark-mode-active) .success-dismiss {
    color: #34d399;
  }

  :global(html.dark-mode-active) .success-dismiss:hover {
    background: rgba(52, 211, 153, 0.15);
  }

  :global(html.dark-mode-active) .error-banner {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  :global(html.dark-mode-active) input,
  :global(html.dark-mode-active) textarea {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border);
    color: var(--color-text-primary);
  }

  :global(html.dark-mode-active) input:focus,
  :global(html.dark-mode-active) textarea:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
  }

  :global(html.dark-mode-active) input.error,
  :global(html.dark-mode-active) textarea.error {
    border-color: #ef4444;
  }

  :global(html.dark-mode-active) .error-message {
    color: #f87171;
  }

  :global(html.dark-mode-active) .alternative-contact {
    border-top-color: var(--color-border);
  }

  @media (prefers-contrast: high) {
    .contact-form {
      border: 2px solid #000000;
      box-shadow: none;
    }

    label {
      color: #000000;
      font-weight: 700;
    }

    input,
    textarea {
      border: 2px solid #000000;
    }

    .submit-button {
      background: #000000;
      color: #ffffff;
    }

    .submit-button:hover {
      background: #ffffff;
      color: #000000;
      border: 2px solid #000000;
    }
  }

  @media print {
    .contact-section {
      background: #ffffff;
      padding: 1rem 0;
    }

    .contact-form {
      border: 1px solid #000000;
      box-shadow: none;
    }

    .contact-title {
      color: #000000;
    }

    label {
      color: #000000;
    }

    input,
    textarea {
      border: 1px solid #000000;
    }

    .submit-button {
      display: none;
    }

    .alternative-contact {
      border-top: 1px solid #000000;
      color: #000000;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    input,
    textarea,
    .submit-button {
      transition: none;
    }

    .submit-button:hover {
      transform: none;
    }
  }
</style>
