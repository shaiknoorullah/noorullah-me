// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// Keystatic is a dev-only editor (git-backed content): its admin/API routes
// are mounted only when the CMS is explicitly requested, so production
// builds stay fully static.  npm run cms  ->  /keystatic
const cms = process.env.KEYSTATIC
  ? [(await import('@keystatic/astro')).default()]
  : [];

// https://astro.build/config
export default defineConfig({
  site: 'https://www.noorullah.me',
  integrations: [react(), sitemap(), mdx(), ...cms],
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // R12 — split the heavy vendor ecosystems out of the island chunk
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('@react-three/') || id.includes('react-reconciler')) return 'vendor-r3f';
            if (id.includes('postprocessing')) return 'vendor-post';
            if (id.includes('/gsap/')) return 'vendor-gsap';
            if (id.includes('/three/') || id.includes('troika')) return 'vendor-three';
          },
        },
      },
    },
  },
});
