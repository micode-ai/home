/**
 * Validation service for form inputs
 */

/**
 * Validates email format using regex
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that a field is not empty
 * @param value - Value to validate
 * @returns True if value is not empty, false otherwise
 */
export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Form data interface
 */
export interface FormData {
  name: string;
  email: string;
  message: string;
}

/**
 * Translation interface for error messages
 */
export interface ValidationTranslations {
  nameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  messageRequired: string;
}

/**
 * Validates form data and returns errors object
 * @param data - Form data to validate
 * @param translations - Translation object for error messages
 * @returns Object with errors for each field
 */
export function validateForm(
  data: FormData,
  translations: ValidationTranslations
): Partial<Record<keyof FormData, string>> {
  const errors: Partial<Record<keyof FormData, string>> = {};

  if (!validateRequired(data.name)) {
    errors.name = translations.nameRequired;
  }

  if (!validateRequired(data.email)) {
    errors.email = translations.emailRequired;
  } else if (!validateEmail(data.email)) {
    errors.email = translations.emailInvalid;
  }

  if (!validateRequired(data.message)) {
    errors.message = translations.messageRequired;
  }

  return errors;
}
