/*
 * VITE CONFIG - v2.5
 * ==================
 *
 * Vite is a build tool. Browsers cannot read .tsx files, so something has to
 * turn them into plain JavaScript. That something is Vite.
 *
 * Two jobs:
 *   npm run dev    - a development server that instantly reloads when you save
 *   npm run build  - produce the final files that go into public/
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Where the front-end source lives. Vite looks for index.html here.
  root: 'web',

  plugins: [react()],

  build: {
    // Put the finished files where our Node server already serves from.
    // '../public' is relative to `root` above.
    outDir: '../public',
    emptyOutDir: true,
  },

  server: {
    port: 5173,

    // THE IMPORTANT BIT.
    //
    // In development the React app runs on port 5173, but the API lives on
    // port 3000. A browser refuses to let a page on one port call another -
    // a security rule called CORS.
    //
    // This proxy sidesteps it: any request starting with /api gets quietly
    // forwarded to port 3000. The browser thinks everything came from 5173.
    //
    // In production there is no proxy and no problem, because `npm run build`
    // puts the React app inside public/, served by the same server as the API.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
