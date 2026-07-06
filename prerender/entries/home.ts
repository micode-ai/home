import { render } from 'svelte/server';
import App from '../../src/App.svelte';
import { languageStore, type Language } from '../../src/stores/languageStore';

export function renderPage(lang: Language = 'pl') {
  languageStore.set(lang);
  return render(App, { props: {} });
}
