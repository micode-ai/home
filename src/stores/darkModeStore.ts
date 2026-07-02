import { writable } from 'svelte/store';

function createDarkModeStore() {
  const { subscribe, set, update } = writable(false);

  function readFromStorage(): boolean | null {
    try {
      const raw = localStorage.getItem('a11y-settings');
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (typeof parsed.darkMode === 'boolean') return parsed.darkMode;
      }
    } catch {}
    return null;
  }

  function prefersDarkOS(): boolean {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {}
    return false;
  }

  function saveToStorage(dark: boolean): void {
    try {
      const raw = localStorage.getItem('a11y-settings');
      const s: Record<string, unknown> = raw ? JSON.parse(raw) : {};
      s.darkMode = dark;
      localStorage.setItem('a11y-settings', JSON.stringify(s));
    } catch {}
  }

  return {
    subscribe,
    init() {
      const stored = readFromStorage();
      const dark = stored === null ? prefersDarkOS() : stored;
      set(dark);
      document.documentElement.classList.toggle('dark-mode-active', dark);
    },
    toggle() {
      update(dark => {
        const next = !dark;
        document.documentElement.classList.toggle('dark-mode-active', next);
        saveToStorage(next);
        return next;
      });
    }
  };
}

export const darkModeStore = createDarkModeStore();
