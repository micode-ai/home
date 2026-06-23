import { writable } from 'svelte/store';

function createDarkModeStore() {
  const { subscribe, set, update } = writable(false);

  function readFromStorage(): boolean {
    try {
      const raw = localStorage.getItem('a11y-settings');
      if (raw) return (JSON.parse(raw) as Record<string, unknown>).darkMode === true;
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
      const dark = readFromStorage();
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
