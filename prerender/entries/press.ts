import { render } from 'svelte/server';
import PressKitApp from '../../src/PressKitApp.svelte';
import { languageStore, type Language } from '../../src/stores/languageStore';

export function renderPage(lang: Language = 'pl') {
  languageStore.set(lang);
  return render(PressKitApp, { props: {} });
}
