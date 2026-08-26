/**
 * Conversion / funnel event tracking
 *
 * One dispatch point for every marketing event on the site. Each event goes to
 * both channels the site already loads — GA4 (`gtag`) and emarketingai.pl
 * (`mktai`). Neither is present before cookie consent, so every call is gated
 * on the same consent key the loaders use; components never have to check it.
 */
import { getItem } from './storage';
import { mktaiEvent, mktaiConversion } from './mktai';
import { languageStore } from '../stores/languageStore';
import { stripLocale } from './locale';

const CONSENT_KEY = 'cookieConsent';

function consented(): boolean {
  return getItem(CONSENT_KEY) === 'accepted';
}

/**
 * Coarse page bucket, so one event name can be compared across the site
 * (a `cta_click` on a product page vs. on the landing page).
 */
export function pageType(pathname: string): string {
  const route = stripLocale(pathname).replace(/\/+$/, '');
  if (route === '') return 'home';

  const [first, second] = route.split('/');
  if (first === 'blog') return second ? 'article' : 'blog_listing';
  if (first === 'products') return 'product';
  if (first === 'privacy-policy') return 'privacy';
  return 'other';
}

function dispatch(
  name: string,
  params: Record<string, unknown> | undefined,
  conversion: boolean
): void {
  if (typeof window === 'undefined' || !consented()) return;

  const enriched: Record<string, unknown> = {
    language: languageStore.getCurrentLanguage(),
    page_type: pageType(window.location.pathname),
    ...params
  };

  try {
    window.gtag?.('event', name, enriched);
  } catch (error) {
    console.warn(`Tracking: GA4 event "${name}" failed`, error);
  }

  try {
    if (conversion) {
      mktaiConversion(name, enriched);
    } else {
      mktaiEvent(name, 'event', enriched);
    }
  } catch (error) {
    console.warn(`Tracking: mktai event "${name}" failed`, error);
  }
}

/** A funnel step: CTA clicks, product opens, outbound clicks, scroll depth. */
export function track(name: string, params?: Record<string, unknown>): void {
  dispatch(name, params, false);
}

/** A goal: currently only a delivered contact-form submission. */
export function trackConversion(name: string, params?: Record<string, unknown>): void {
  dispatch(name, params, true);
}
