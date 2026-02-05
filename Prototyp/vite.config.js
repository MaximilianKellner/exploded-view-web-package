import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  // Deduplizierung: Verhindert mehrfaches Laden von Three.js (z.B. bei verschachtelten Dependencies)
  resolve: {
    dedupe: ['three']
  },
  server: {
    host: true // Erlaubt den Zugriff aus dem lokalen Netzwerk
  },
  build: {
    lib: {
      entry: {
          'exploded-viewer': resolve(__dirname, 'src/index.js')
      },
      name: 'ExplodedViewer',
      // the proper extensions will be added
      fileName: (format, entryName) => {
        if (format === 'umd') {
          return `${entryName}.umd.cjs`;
        } else if (format === 'es') {
          return `${entryName}.js`;
        }
      }
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['three', 'tweakpane', 'animejs', 'stats.js'],
      output: {
        // Ensure named exports are used to avoid default+named export warning
        exports: 'named',
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          three: 'THREE',
          tweakpane: 'Tweakpane',
          animejs: 'anime',
          'stats.js': 'Stats',
        },
      },
    },
  },
});