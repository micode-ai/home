/**
 * Storage service for localStorage operations with error handling
 * Gracefully handles cases where localStorage is unavailable
 */

/**
 * Check if localStorage is available
 * @returns True if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get an item from localStorage
 * @param key - The key to retrieve
 * @returns The value or null if not found or localStorage unavailable
 */
export function getItem(key: string): string | null {
  try {
    if (!isLocalStorageAvailable()) {
      return null;
    }
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to get item from localStorage: ${key}`, e);
    return null;
  }
}

/**
 * Set an item in localStorage
 * @param key - The key to set
 * @param value - The value to store
 * @returns True if successful, false otherwise
 */
export function setItem(key: string, value: string): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Failed to set item in localStorage: ${key}`, e);
    return false;
  }
}

/**
 * Remove an item from localStorage
 * @param key - The key to remove
 * @returns True if successful, false otherwise
 */
export function removeItem(key: string): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      return false;
    }
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`Failed to remove item from localStorage: ${key}`, e);
    return false;
  }
}
