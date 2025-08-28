import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'

const plugins = [
  resolve({
    preferBuiltins: false,
    browser: true,
  }),
  commonjs(),
  json(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: true,
    declarationDir: './lib',
    module: 'esnext',
    target: 'es2017',
  }),
]

export default [
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
