import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://migueltechlead.pt',
  vite: {
    plugins: [tailwindcss()],
  },
});
