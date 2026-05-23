import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateEmail, validateRequired, validateForm } from './validation';

const translations = {
  nameRequired: 'Name required',
  emailRequired: 'Email required',
  emailInvalid: 'Email invalid',
  messageRequired: 'Message required',
};

describe('validateEmail()', () => {
  it('accepts a standard email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('accepts email with subdomain', () => {
    expect(validateEmail('user@mail.example.org')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('rejects missing @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('rejects missing domain part', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejects missing local part', () => {
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('rejects email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false);
  });

  it('property: no whitespace-only string is a valid email', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }).filter(s => /^\s+$/.test(s)), (s) => {
        return !validateEmail(s);
      })
    );
  });

  it('property: always returns boolean', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        return typeof validateEmail(s) === 'boolean';
      })
    );
  });
});

describe('validateRequired()', () => {
  it('returns true for non-empty string', () => {
    expect(validateRequired('hello')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(validateRequired('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(validateRequired('   ')).toBe(false);
  });

  it('returns false for tab-only string', () => {
    expect(validateRequired('\t')).toBe(false);
  });

  it('property: trimmed non-empty strings pass', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (s) => validateRequired(s)
      )
    );
  });
});

describe('validateForm()', () => {
  const valid = { name: 'Jan', email: 'jan@example.com', message: 'Hello' };

  it('returns empty errors for valid data', () => {
    expect(validateForm(valid, translations)).toEqual({});
  });

  it('requires name', () => {
    const errors = validateForm({ ...valid, name: '' }, translations);
    expect(errors.name).toBe('Name required');
  });

  it('requires email', () => {
    const errors = validateForm({ ...valid, email: '' }, translations);
    expect(errors.email).toBe('Email required');
  });

  it('validates email format when present', () => {
    const errors = validateForm({ ...valid, email: 'not-an-email' }, translations);
    expect(errors.email).toBe('Email invalid');
  });

  it('requires message', () => {
    const errors = validateForm({ ...valid, message: '' }, translations);
    expect(errors.message).toBe('Message required');
  });

  it('collects multiple errors at once', () => {
    const errors = validateForm({ name: '', email: '', message: '' }, translations);
    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.message).toBeTruthy();
  });

  it('email-required takes precedence over email-invalid when blank', () => {
    const errors = validateForm({ ...valid, email: '   ' }, translations);
    expect(errors.email).toBe('Email required');
  });
});
