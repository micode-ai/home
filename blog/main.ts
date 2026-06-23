import { mount } from 'svelte';
import BlogApp from '../src/BlogApp.svelte';
import '../src/app.css';

mount(BlogApp, { target: document.getElementById('app')! });
