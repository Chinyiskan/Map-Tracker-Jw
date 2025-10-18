// babel.config.js
// Configuración de Babel para ES Modules con soporte para Jest

export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        },
        modules: false // Preservar ES Modules para Jest
      }
    ],
    // Habilitar soporte para TypeScript (solo transpila tipos)
    '@babel/preset-typescript'
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'auto' // Permitir transformación para Jest en modo test
          }
        ],
        '@babel/preset-typescript'
      ]
    }
  }
};