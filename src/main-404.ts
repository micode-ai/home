import { mount } from 'svelte'
import './app.css'
import NotFoundApp from './NotFoundApp.svelte'

document.documentElement.classList.add('js')

const app = mount(NotFoundApp, {
  target: document.getElementById('app')!,
})

export default app
