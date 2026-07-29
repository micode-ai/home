/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EMAILJS_SERVICE_ID: string;
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  readonly VITE_EMAILJS_PUBLIC_KEY: string;
  readonly VITE_GA_MEASUREMENT_ID: string;
  readonly VITE_MKTAI_SCRIPT_URL: string;
  readonly VITE_MKTAI_TRACKING_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
    mktai?: (type: string, action: string, params?: Record<string, unknown>) => void;
  }
}

export {};
