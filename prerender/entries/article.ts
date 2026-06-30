import { render } from 'svelte/server';
import ArticleApp from '../../src/ArticleApp.svelte';

export function renderPage(slug: string) {
  return render(ArticleApp, { props: { slug } });
}
