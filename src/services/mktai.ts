/**
 * Marketing AI tracking service
 * Conditionally loads the emarketingai.pl tracking snippet based on cookie consent
 */

const MKTAI_SCRIPT_URL = import.meta.env.VITE_MKTAI_SCRIPT_URL;
const MKTAI_TRACKING_ID = import.meta.env.VITE_MKTAI_TRACKING_ID;

const SCRIPT_ID = 'mktai-tracking-script';

let initialized = false;

export function initializeMktai(): void {
  if (initialized) return;

  if (!MKTAI_SCRIPT_URL || !MKTAI_TRACKING_ID) {
    console.warn('Marketing AI: VITE_MKTAI_SCRIPT_URL or VITE_MKTAI_TRACKING_ID is not configured');
    return;
  }

  if (document.getElementById(SCRIPT_ID)) {
    initialized = true;
    return;
  }

  try {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `${MKTAI_SCRIPT_URL}/api/t/snippet/${MKTAI_TRACKING_ID}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    initialized = true;
  } catch (error) {
    console.warn('Marketing AI: Failed to initialize', error);
  }
}

export function mktaiEvent(
  eventName: string,
  action: string,
  params?: Record<string, unknown>
): void {
  if (typeof window.mktai !== 'function') return;
  window.mktai(eventName, action, params);
}

export function mktaiConversion(type: string, params?: Record<string, unknown>): void {
  if (typeof window.mktai !== 'function') return;
  window.mktai('conversion', type, params);
}
