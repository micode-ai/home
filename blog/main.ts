import { hydrate } from 'svelte';
import BlogApp from '../src/BlogApp.svelte';
import '../src/app.css';

hydrate(BlogApp, { target: document.getElementById('app')! });
