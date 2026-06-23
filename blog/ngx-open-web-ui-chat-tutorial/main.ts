import '../../src/app.css';
import ArticleApp from '../../src/ArticleApp.svelte';
import { mount } from 'svelte';

mount(ArticleApp, {
  target: document.getElementById('app')!,
  props: { slug: 'ngx-open-web-ui-chat-tutorial' }
});
