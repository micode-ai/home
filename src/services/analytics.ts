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
    // Must push `arguments`, not a rest-parameter array. gtag.js tells its own
    // commands apart from ordinary dataLayer data by type and only acts on
    // `[object Arguments]`; given a real array it registers its container and
    // then silently ignores every command, `config` included — the library
    // loads, sets no `_ga` cookie and sends nothing at all.
    window.gtag = function gtag() {
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);

    initialized = true;
  } catch (error) {
    console.warn('Google Analytics: Failed to initialize', error);
  }
}
