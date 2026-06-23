import { mount } from 'svelte';
import ProductApp from '../../src/ProductApp.svelte';
import '../../src/app.css';

mount(ProductApp, {
  target: document.getElementById('app')!,
  props: { productId: 'ngx-chat' },
});
