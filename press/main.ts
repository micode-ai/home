import { hydrate } from 'svelte';
import PressKitApp from '../src/PressKitApp.svelte';
import '../src/app.css';

hydrate(PressKitApp, { target: document.getElementById('app')! });
