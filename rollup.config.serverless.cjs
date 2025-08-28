const esbuild = require('rollup-plugin-esbuild').default
const resolve = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
const terser = require('@rollup/plugin-terser')

const plugins = [
  resolve({
    preferBuiltins: false,
    browser: true,
  }),
  commonjs(),
  json(),
  esbuild({
    include: /\.ts$/,
    exclude: /node_modules/,
    sourceMap: false,
    minify: false,
    target: 'es2017',
    tsconfig: './tsconfig.json',
    loaders: {
      '.ts': 'ts',
    },
  }),
]

module.exports = [
  // ESM build
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.esm.js',
      format: 'es',
    },
    plugins,
  },
  // ESM minified
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.esm.min.js',
      format: 'es',
    },
    plugins: [
      ...plugins,
      terser({
        compress: {
          drop_console: true,
          passes: 2,
        },
        mangle: true,
      }),
    ],
  },
  // CommonJS build
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.cjs.js',
      format: 'cjs',
      exports: 'named',
    },
    plugins,
  },
  // UMD build for browsers
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.umd.js',
      format: 'umd',
      name: 'PhoneNumberValidator',
      exports: 'named',
    },
    plugins,
  },
  // UMD minified
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.umd.min.js',
      format: 'umd',
      name: 'PhoneNumberValidator',
      exports: 'named',
    },
    plugins: [
      ...plugins,
      terser({
        compress: {
          drop_console: true,
          passes: 2,
        },
        mangle: true,
      }),
    ],
  },
]