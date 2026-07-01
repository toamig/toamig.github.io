import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://migueltechlead.pt',
  integrations: [
    sitemap({
      // Keep private / noindexed / non-page routes out of the sitemap.
      filter: (page) =>
        !page.includes('/cv/') &&
        !page.includes('/admin') &&
        !page.includes('/og/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
