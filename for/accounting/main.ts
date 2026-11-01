import { hydrate } from 'svelte';
import IndustryApp from '../../src/IndustryApp.svelte';
import '../../src/app.css';

hydrate(IndustryApp, {
  target: document.getElementById('app')!,
  props: { industryId: 'accounting' },
});
