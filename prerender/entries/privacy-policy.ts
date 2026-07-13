import { render } from 'svelte/server';
import PrivacyPolicyApp from '../../src/PrivacyPolicyApp.svelte';
import { languageStore, type Language } from '../../src/stores/languageStore';

export function renderPage(lang: Language = 'pl') {
  languageStore.set(lang);
  return render(PrivacyPolicyApp, { props: {} });
}
