import { hydrate } from 'svelte';
import ProductApp from '../../src/ProductApp.svelte';
import '../../src/app.css';

hydrate(ProductApp, {
  target: document.getElementById('app')!,
  props: { productId: 'accounting-ai' },
});
