import { render } from 'svelte/server';
import BlogApp from '../../src/BlogApp.svelte';
import { languageStore, type Language } from '../../src/stores/languageStore';

export function renderPage(lang: Language = 'pl') {
  languageStore.set(lang);
  return render(BlogApp, { props: {} });
}
