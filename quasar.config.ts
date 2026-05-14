import { defineConfig } from '#q-app/wrappers';

export default defineConfig((/* ctx */) => {
  return {
    boot: [
      'pinia',
      'theme',
    ],

    css: [
      'app.scss',
    ],

    extras: [
      'material-icons',
      'mdi-v7',
    ],

    build: {
      target: {
        browser: 'baseline-widely-available',
        node: 'node22',
      },

      typescript: {
        strict: true,
        vueShim: true,
      },

      vueRouterMode: 'hash',
      publicPath: '/hexxen-character-tool/',

      vitePlugins: [
        ['vite-plugin-checker', {
          vueTsc: true,
          eslint: {
            lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
            useFlatConfig: true,
          },
        }, { server: false }],
      ],
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {
        dark: 'auto',
        notify: {},
        brand: {
          primary:   '#0e495c',
          secondary: '#35b9e9',
          accent:    '#c0682b',
          dark:      '#1d1d1d',
          positive:  '#21ba45',
          negative:  '#c10015',
          info:      '#31ccec',
          warning:   '#f2c037',
        },
      },
      plugins: [
        'Notify',
        'Dialog',
        'LocalStorage',
        'Loading',
      ],
    },

    animations: [],

    pwa: {
      workboxMode: 'GenerateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
    },
  };
});
