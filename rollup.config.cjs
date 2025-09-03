const { readFileSync } = require('node:fs')
const esbuild = require('rollup-plugin-esbuild').default
const resolve = require('@rollup/plugin-node-resolve').default
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
const terser = require('@rollup/plugin-terser').default

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// External dependencies for main build
const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})]

// Base ESBuild config
const esbuildBase = {
  include: /\.ts$/,
  exclude: /node_modules/,
  sourceMap: false,
  minify: false,
  target: 'es2017',
  tsconfig: './tsconfig.json',
  loaders: {
    '.ts': 'ts',
  },
}

// Main library config (external dependencies)
const mainConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
  external,
  plugins: [esbuild(esbuildBase)],
}

// Serverless bundled config
const serverlessPlugins = [
  resolve({
    preferBuiltins: false,
    browser: true,
  }),
  commonjs(),
  json(),
  esbuild(esbuildBase),
]

const serverlessConfig = [
  // ESM build
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.esm.js',
      format: 'es',
    },
    plugins: serverlessPlugins,
  },
  // ESM minified
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.esm.min.js',
      format: 'es',
    },
    plugins: [
      ...serverlessPlugins,
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
    plugins: serverlessPlugins,
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
    plugins: serverlessPlugins,
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
      ...serverlessPlugins,
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

// Export all configs
module.exports = [mainConfig, ...serverlessConfig]