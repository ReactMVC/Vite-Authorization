import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        userPage: 'pages/user.html',
        registerPage: 'pages/register.html'
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
});