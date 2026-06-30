import { render } from 'svelte/server';
import ProductApp from '../../src/ProductApp.svelte';

export function renderPage(productId: string) {
  return render(ProductApp, { props: { productId } });
}
