<script lang="ts">
  import { onDestroy } from 'svelte';
  import emailjs from '@emailjs/browser';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { validateForm, type FormData } from '../services/validation';

  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  let currentLang: string;
  const unsubscribe = languageStore.subscribe(lang => {
    currentLang = lang;
  });

  onDestroy(() => {
    unsubscribe();
  });

  let formData: FormData = {
    name: '',
    email: '',
    message: ''
  };

  let errors: Partial<Record<keyof FormData, string>> = {};
  let isSubmitted = false;
  let isSubmitting = false;
  let submitError = false;
  let touched: Partial<Record<keyof FormData, boolean>> = {};

  function handleBlur(field: keyof FormData) {
    touched[field] = true;
    validateField(field);
  }

  function validateField(field: keyof FormData) {
    if (!touched[field]) return;

    const translations = {
      nameRequired: t('contact.errors.nameRequired', currentLang),
      emailRequired: t('contact.errors.emailRequired', currentLang),
      emailInvalid: t('contact.errors.emailInvalid', currentLang),
      messageRequired: t('contact.errors.messageRequired', currentLang)
    };

    const allErrors = validateForm(formData, translations);

    if (allErrors[field]) {
      errors[field] = allErrors[field];
    } else {
      delete errors[field];
    }
    errors = errors;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    touched = { name: true, email: true, message: true };

    const translations = {
      nameRequired: t('contact.errors.nameRequired', currentLang),
      emailRequired: t('contact.errors.emailRequired', currentLang),
      emailInvalid: t('contact.errors.emailInvalid', currentLang),
      messageRequired: t('contact.errors.messageRequired', currentLang)
    };

    errors = validateForm(formData, translations);

    if (Object.keys(errors).length === 0) {
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

        setTimeout(() => {
          isSubmitted = false;
        }, 5000);
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
      <h2 id="contact-title" class="contact-title">{t('contact.title', currentLang)}</h2>

      {#if isSubmitted}
        <div class="success-message" role="alert" aria-live="polite">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          <span>{t('contact.success', currentLang)}</span>
        </div>
      {/if}

      {#if submitError}
        <div class="error-banner" role="alert" aria-live="polite">
          {t('contact.errors.submitFailed', currentLang)}
        </div>
      {/if}

      <form on:submit={handleSubmit} novalidate aria-label="Contact form">
        <div class="form-group">
          <label for="name">{t('contact.name', currentLang)}</label>
          <input
            type="text"
            id="name"
            bind:value={formData.name}
            on:blur={() => handleBlur('name')}
            on:input={() => validateField('name')}
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
          <label for="email">{t('contact.email', currentLang)}</label>
          <input
            type="email"
            id="email"
            bind:value={formData.email}
            on:blur={() => handleBlur('email')}
            on:input={() => validateField('email')}
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
          <label for="message">{t('contact.message', currentLang)}</label>
          <textarea
            id="message"
            bind:value={formData.message}
            on:blur={() => handleBlur('message')}
            on:input={() => validateField('message')}
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

        <button type="submit" class="submit-button" disabled={isSubmitting} aria-label="{t('contact.send', currentLang)}">
          {#if isSubmitting}
            {t('contact.sending', currentLang)}
          {:else}
            {t('contact.send', currentLang)}
          {/if}
        </button>
      </form>

      <div class="alternative-contact" role="complementary" aria-label="Alternative contact information">
        <p>{t('contact.alternativeContact', currentLang)}</p>
        <p><strong>perevertkinma@gmail.com</strong></p>
      </div>
    </div>
  </div>
</section>

<style>
  .contact-section {
    background: var(--color-bg-tertiary);
    padding: 5rem 0;
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
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.2;
  }

  .success-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
    padding: 1rem;
    border-radius: var(--radius-lg);
    margin-bottom: 1.5rem;
    text-align: center;
    font-weight: 500;
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
    border-color: #dc2626;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.8125rem;
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
    .contact-section {
      padding: 3rem 0;
    }

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
    .contact-section {
      padding: 4rem 0;
    }

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

  @media (prefers-color-scheme: dark) {
    .contact-form {
      background: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .success-message {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    input,
    textarea {
      background: var(--color-bg-tertiary);
      border-color: var(--color-border);
      color: var(--color-text-primary);
    }

    input:focus,
    textarea:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
    }

    input.error,
    textarea.error {
      border-color: #ef4444;
    }

    .error-message {
      color: #f87171;
    }

    .alternative-contact {
      border-top-color: var(--color-border);
    }
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
