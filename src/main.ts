import { hydrate } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = hydrate(App, {
  target: document.getElementById('app')!,
})

export default app
