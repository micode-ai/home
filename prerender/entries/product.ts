import { render } from 'svelte/server';
import ProductApp from '../../src/ProductApp.svelte';
import { languageStore, type Language } from '../../src/stores/languageStore';

export function renderPage(productId: string, lang: Language = 'pl') {
  languageStore.set(lang);
  return render(ProductApp, { props: { productId } });
}
