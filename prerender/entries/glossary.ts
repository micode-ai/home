import { render } from 'svelte/server';
import GlossaryApp from '../../src/GlossaryApp.svelte';
import { languageStore, type Language } from '../../src/stores/languageStore';

export function renderPage(lang: Language = 'pl') {
  languageStore.set(lang);
  return render(GlossaryApp, { props: {} });
}
