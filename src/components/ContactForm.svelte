<script lang="ts">
  import { onDestroy } from 'svelte';
  import { languageStore } from '../stores/languageStore';
  import { t } from '../services/i18n';
  import { validateForm, type FormData } from '../services/validation';

  let currentLang: string;
  const unsubscribe = languageStore.subscribe(lang => {
    currentLang = lang;
  });

  onDestroy(() => {
    unsubscribe();
  });

  // Form state
  let formData: FormData = {
    name: '',
    email: '',
    message: ''
  };

  let errors: Partial<Record<keyof FormData, string>> = {};
  let isSubmitted = false;
  let touched: Partial<Record<keyof FormData, boolean>> = {};

  // Validate on blur
  function handleBlur(field: keyof FormData) {
    touched[field] = true;
    validateField(field);
  }

  // Validate single field
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
    errors = errors; // Trigger reactivity
  }

  // Handle form submission
  function handleSubmit(event: Event) {
    event.preventDefault();

    // Mark all fields as touched
    touched = { name: true, email: true, message: true };

    const translations = {
      nameRequired: t('contact.errors.nameRequired', currentLang),
      emailRequired: t('contact.errors.emailRequired', currentLang),
      emailInvalid: t('contact.errors.emailInvalid', currentLang),
      messageRequired: t('contact.errors.messageRequired', currentLang)
    };

    errors = validateForm(formData, translations);

    // If no errors, show success message
    if (Object.keys(errors).length === 0) {
      isSubmitted = true;
      // Reset form
      formData = { name: '', email: '', message: '' };
      touched = {};
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        isSubmitted = false;
      }, 5000);
    }
  }
</script>

<section class="contact-form scroll-reveal" id="contact" aria-labelledby="contact-title">
  <h2 id="contact-title">{t('contact.title', currentLang)}</h2>

  {#if isSubmitted}
    <div class="success-message" role="alert" aria-live="polite">
      {t('contact.success', currentLang)}
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

    <button type="submit" class="submit-button" aria-label="{t('contact.send', currentLang)}">
      {t('contact.send', currentLang)}
    </button>
  </form>

  <div class="alternative-contact" role="complementary" aria-label="Alternative contact information">
    <p>{t('contact.alternativeContact', currentLang)}</p>
    <p><strong>perevertkinma@gmail.com</strong></p>
  </div>
</section>

<style>
  .contact-form {
    max-width: 600px;
    margin: 4rem auto;
    padding: 2.5rem;
    background: var(--glass-bg-medium);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border-radius: var(--radius-glass-lg);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
  }

  h2 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .success-message {
    background: rgba(46, 204, 113, 0.15);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(46, 204, 113, 0.3);
    color: #27ae60;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 600;
    font-size: 0.95rem;
  }

  input,
  textarea {
    padding: 0.75rem;
    background: var(--glass-bg);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 12px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    color: #2c3e50;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: rgba(102, 126, 234, 0.6);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    background: var(--glass-bg-medium);
  }

  input.error,
  textarea.error {
    border-color: #dc3545;
  }

  .error-message {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: -0.25rem;
  }

  .submit-button {
    padding: 0.75rem 2rem;
    background: var(--gradient-accent);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 44px;
    min-width: 44px;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    animation: glow-pulse 3s ease-in-out infinite;
  }

  .submit-button:hover {
    background: var(--gradient-accent-hover);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    transform: translateY(-1px);
  }

  .submit-button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
  }

  .alternative-contact {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center;
  }

  .alternative-contact p {
    margin: 0.5rem 0;
  }

  /* Mobile styles (< 768px) */
  @media (max-width: 767px) {
    .contact-form {
      margin: 2.5rem 1rem;
      padding: 1.5rem 1rem;
    }

    h2 {
      font-size: 1.5rem;
      margin-bottom: 1.25rem;
    }

    .success-message {
      padding: 0.875rem;
      font-size: 0.9375rem;
      margin-bottom: 1.25rem;
    }

    form {
      gap: 1.25rem;
    }

    .form-group {
      gap: 0.4375rem;
    }

    label {
      font-size: 0.9rem;
    }

    input,
    textarea {
      padding: 0.6875rem;
      font-size: 0.9375rem;
    }

    .error-message {
      font-size: 0.8125rem;
    }

    .submit-button {
      padding: 0.875rem 2rem;
      font-size: 0.9375rem;
      width: 100%;
      /* Ensure touch-friendly size (44x44px minimum) */
      min-height: 44px;
      min-width: 44px;
    }

    .alternative-contact {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      font-size: 0.9375rem;
    }

    .alternative-contact p {
      margin: 0.4375rem 0;
    }
  }

  /* Tablet styles (768px - 1024px) */
  @media (min-width: 768px) and (max-width: 1024px) {
    .contact-form {
      padding: 2rem 1.5rem;
    }

    h2 {
      font-size: 1.75rem;
      margin-bottom: 1.375rem;
    }

    .success-message {
      padding: 0.9375rem;
      font-size: 0.96875rem;
      margin-bottom: 1.375rem;
    }

    form {
      gap: 1.375rem;
    }

    .form-group {
      gap: 0.46875rem;
    }

    label {
      font-size: 0.925rem;
    }

    input,
    textarea {
      padding: 0.71875rem;
      font-size: 0.96875rem;
    }

    .error-message {
      font-size: 0.84375rem;
    }

    .submit-button {
      padding: 0.8125rem 2.125rem;
      font-size: 0.96875rem;
      min-height: 44px;
      min-width: 44px;
    }

    .alternative-contact {
      margin-top: 1.75rem;
      padding-top: 1.75rem;
      font-size: 0.96875rem;
    }

    .alternative-contact p {
      margin: 0.46875rem 0;
    }
  }

  /* Desktop styles (> 1024px) */
  @media (min-width: 1025px) {
    .contact-form {
      padding: 2rem;
    }

    h2 {
      font-size: 2rem;
      margin-bottom: 1.5rem;
    }

    .success-message {
      padding: 1rem;
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }

    form {
      gap: 1.5rem;
    }

    .form-group {
      gap: 0.5rem;
    }

    label {
      font-size: 0.95rem;
    }

    input,
    textarea {
      padding: 0.75rem;
      font-size: 1rem;
    }

    .error-message {
      font-size: 0.875rem;
    }

    .submit-button {
      padding: 0.75rem 2rem;
      font-size: 1rem;
      min-height: 44px;
      min-width: 44px;
    }

    .alternative-contact {
      margin-top: 2rem;
      padding-top: 2rem;
      font-size: 1rem;
    }

    .alternative-contact p {
      margin: 0.5rem 0;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    h2 {
      color: #ffffff;
    }

    .success-message {
      background: rgba(46, 204, 113, 0.1);
      border-color: rgba(46, 204, 113, 0.2);
      color: #34d399;
    }

    label {
      color: #ffffff;
    }

    input,
    textarea {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    input:focus,
    textarea:focus {
      border-color: rgba(102, 126, 234, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }

    input.error,
    textarea.error {
      border-color: #e74c3c;
    }

    .error-message {
      color: #f87171;
    }

    .alternative-contact {
      border-top-color: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.7);
    }

    .alternative-contact strong {
      color: #ffffff;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .contact-form {
      background-color: #ffffff;
      border: 2px solid #000000;
    }

    h2 {
      color: #000000;
      font-weight: 800;
    }

    .success-message {
      background-color: #ffffff;
      border: 2px solid #000000;
      color: #000000;
      font-weight: 600;
    }

    label {
      color: #000000;
      font-weight: 700;
    }

    input,
    textarea {
      background-color: #ffffff;
      border: 2px solid #000000;
      color: #000000;
    }

    input:focus,
    textarea:focus {
      border-color: #000000;
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.2);
    }

    input.error,
    textarea.error {
      border-color: #ff0000;
      border-width: 3px;
    }

    .error-message {
      color: #ff0000;
      font-weight: 700;
    }

    .submit-button {
      background-color: #000000;
      color: #ffffff;
      border: 2px solid #000000;
      font-weight: 700;
    }

    .submit-button:hover {
      background-color: #ffffff;
      color: #000000;
    }

    .alternative-contact {
      border-top: 2px solid #000000;
      color: #000000;
    }

    .alternative-contact strong {
      font-weight: 800;
    }
  }

  /* Print styles */
  @media print {
    .contact-form {
      background-color: #ffffff;
      padding: 1rem;
      page-break-inside: avoid;
    }

    h2 {
      color: #000000;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .success-message {
      background-color: #ffffff;
      border: 1px solid #000000;
      color: #000000;
      padding: 0.75rem;
      margin-bottom: 1rem;
    }

    form {
      gap: 1rem;
    }

    .form-group {
      gap: 0.375rem;
    }

    label {
      color: #000000;
      font-size: 0.875rem;
    }

    input,
    textarea {
      background-color: #ffffff;
      border: 1px solid #000000;
      color: #000000;
      padding: 0.5rem;
      font-size: 0.875rem;
    }

    .error-message {
      color: #000000;
      font-size: 0.75rem;
    }

    .submit-button {
      display: none;
    }

    .alternative-contact {
      border-top: 1px solid #000000;
      margin-top: 1rem;
      padding-top: 1rem;
      color: #000000;
      font-size: 0.875rem;
    }

    .alternative-contact p {
      margin: 0.25rem 0;
    }

    .alternative-contact strong {
      font-weight: 700;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    input,
    textarea,
    .submit-button {
      transition: none;
      animation: none;
    }
  }
</style>
