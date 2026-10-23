import '../../src/app.css';
import ArticleApp from '../../src/ArticleApp.svelte';
import { hydrate } from 'svelte';

hydrate(ArticleApp, {
  target: document.getElementById('app')!,
  props: { slug: 'langgraph-agent-80-tools-structure' }
});
