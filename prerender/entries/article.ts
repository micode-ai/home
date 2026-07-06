import { render } from 'svelte/server';
import ArticleApp from '../../src/ArticleApp.svelte';
import { languageStore, type Language } from '../../src/stores/languageStore';

export function renderPage(slug: string, lang: Language = 'pl') {
  languageStore.set(lang);
  return render(ArticleApp, { props: { slug } });
}
