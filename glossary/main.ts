import { hydrate } from 'svelte';
import GlossaryApp from '../src/GlossaryApp.svelte';
import '../src/app.css';

hydrate(GlossaryApp, { target: document.getElementById('app')! });
