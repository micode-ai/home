import { render } from 'svelte/server';
import IndustryApp from '../../src/IndustryApp.svelte';
import { languageStore, type Language } from '../../src/stores/languageStore';

export function renderPage(industryId: string, lang: Language = 'pl') {
  languageStore.set(lang);
  return render(IndustryApp, { props: { industryId } });
}
