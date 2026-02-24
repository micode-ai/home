/**
 * Google Analytics 4 service
 * Handles conditional loading of gtag.js based on cookie consent
 */

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

/**
 * Initialize Google Analytics by injecting the gtag.js script
 * Only loads if not already initialized and measurement ID is configured
 */
export function initializeAnalytics(): void {
  if (initialized) {
    return;
  }

  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics: VITE_GA_MEASUREMENT_ID is not configured');
    return;
  }

  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);

    initialized = true;
  } catch (error) {
    console.warn('Google Analytics: Failed to initialize', error);
  }
}
