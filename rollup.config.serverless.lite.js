import typescript from 'rollup-plugin-typescript2'
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
    tsconfigOverride: {
      compilerOptions: {
        declaration: true,
        module: 'esnext',
        target: 'es2017',
      },
    },
  }),
]

export default [
  // ESM build
  {
    input: 'src/index.serverless.lite.ts',
    output: {
      file: 'lib/serverless.lite.esm.js',
      format: 'es',
    },
    plugins,
  },
  // ESM minified
  {
    input: 'src/index.serverless.lite.ts',
    output: {
      file: 'lib/serverless.lite.esm.min.js',
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
    input: 'src/index.serverless.lite.ts',
    output: {
      file: 'lib/serverless.lite.cjs.js',
      format: 'cjs',
      exports: 'named',
    },
    plugins,
  },
  // UMD build for browsers
  {
    input: 'src/index.serverless.lite.ts',
    output: {
      file: 'lib/serverless.lite.umd.js',
      format: 'umd',
      name: 'PhoneNumberValidator',
      exports: 'named',
    },
    plugins,
  },
  // UMD minified
  {
    input: 'src/index.serverless.lite.ts',
    output: {
      file: 'lib/serverless.lite.umd.min.js',
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
