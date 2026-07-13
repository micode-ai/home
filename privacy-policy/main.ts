import { hydrate } from 'svelte';
import PrivacyPolicyApp from '../src/PrivacyPolicyApp.svelte';
import '../src/app.css';

hydrate(PrivacyPolicyApp, { target: document.getElementById('app')! });
