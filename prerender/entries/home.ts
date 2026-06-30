import { render } from 'svelte/server';
import App from '../../src/App.svelte';

export function renderPage() {
  return render(App, { props: {} });
}
