import '../../src/app.css';
import ArticleApp from '../../src/ArticleApp.svelte';
import { hydrate } from 'svelte';

hydrate(ArticleApp, {
  target: document.getElementById('app')!,
  props: { slug: 'ai-act-sierpien-2026-co-obowiazuje' }
});
