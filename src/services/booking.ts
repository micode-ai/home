// Configured via VITE_BOOKING_URL; falls back to a placeholder until the founder
// sets up a real Calendly/cal.com account (calendar setup is out of scope here).
const FALLBACK_BOOKING_URL = 'https://calendly.com/mi-code/30min';

export const BOOKING_URL = import.meta.env.VITE_BOOKING_URL || FALLBACK_BOOKING_URL;
