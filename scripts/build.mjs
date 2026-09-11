import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
await cp('public', 'dist', { recursive: true });
await build({ entryPoints: ['src/popup.ts', 'src/background.ts', 'src/offscreen.ts', 'src/worklet.ts'], outdir: 'dist', bundle: true, format: 'esm', target: 'chrome116', minify: true });
console.log('Chrome extension built in dist/');
