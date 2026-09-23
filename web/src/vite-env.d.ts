/// <reference types="vite/client" />

/*
 * Importing a .css file is not normal TypeScript - it only works because
 * Vite handles it. This one line pulls in Vite's own type declarations,
 * which tell TypeScript that such imports are legal.
 *
 * A .d.ts file contains type information only. No code, nothing to run.
 */
