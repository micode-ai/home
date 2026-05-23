const available = (() => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
})();

export function getItem(key: string): string | null {
  if (!available) return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to get item from localStorage: ${key}`, e);
    return null;
  }
}

export function setItem(key: string, value: string): boolean {
  if (!available) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Failed to set item in localStorage: ${key}`, e);
    return false;
  }
}

export function removeItem(key: string): boolean {
  if (!available) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`Failed to remove item from localStorage: ${key}`, e);
    return false;
  }
}
