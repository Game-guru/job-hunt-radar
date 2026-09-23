/*
 * ENTRY POINT - v2.5
 * ==================
 *
 * The smallest file in the project. It does one thing: find the empty <div>
 * in index.html and tell React to take over from there.
 *
 * Everything else on the page is built by components.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles.css';

// The ! means "I promise this is not null".
// TypeScript cannot know index.html has a #root div, but we do.
const rootElement = document.querySelector('#root')!;

// StrictMode is a development-only helper. It deliberately runs some code
// twice to expose bugs caused by code that is not safe to re-run.
// It disappears in the production build.
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
