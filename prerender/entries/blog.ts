import { render } from 'svelte/server';
import BlogApp from '../../src/BlogApp.svelte';

export function renderPage() {
  return render(BlogApp, { props: {} });
}
