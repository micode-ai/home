import { hydrate } from 'svelte'
import './app.css'
import App from './App.svelte'

document.documentElement.classList.add('js')

const app = hydrate(App, {
  target: document.getElementById('app')!,
})

export default app
