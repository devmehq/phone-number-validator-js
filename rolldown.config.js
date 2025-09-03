import { readFileSync } from 'node:fs'
import { defineConfig } from 'rolldown'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// External dependencies - don't bundle these
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]

// Main library build (with external dependencies)
export default defineConfig([
  // Main build - CommonJS and ESM
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'lib/index.js',
        format: 'cjs',
      },
      {
        file: 'lib/index.es.js',
        format: 'es',
      },
    ],
    external,
    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },
  },
  // Serverless build - Bundle everything
  {
    input: 'src/index.serverless.ts',
    output: [
      {
        file: 'lib/serverless.cjs.js',
        format: 'cjs',
        exports: 'named',
      },
      {
        file: 'lib/serverless.esm.js',
        format: 'es',
      },
      {
        file: 'lib/serverless.umd.js',
        format: 'umd',
        name: 'PhoneNumberValidator',
        exports: 'named',
      },
    ],
    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },
  },
  // Serverless minified builds
  {
    input: 'src/index.serverless.ts',
    output: [
      {
        file: 'lib/serverless.esm.min.js',
        format: 'es',
        minify: true,
      },
      {
        file: 'lib/serverless.umd.min.js',
        format: 'umd',
        name: 'PhoneNumberValidator',
        exports: 'named',
        minify: true,
      },
    ],
    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },
  },
])
