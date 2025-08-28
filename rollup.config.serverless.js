import typescript from 'rollup-plugin-typescript2'
import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, extname } from 'path'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'

function serverlessResourcePlugin() {
  return {
    name: 'serverless-resource',
    generateBundle(options, bundle) {
      const resourcesPath = join(__dirname, 'resources')
      const resources = new Map()

      function scanDir(dir, basePath = '') {
        if (!existsSync(dir)) return

        const items = readdirSync(dir)
        for (const item of items) {
          const fullPath = join(dir, item)
          const stat = statSync(fullPath)

          if (stat.isDirectory()) {
            scanDir(fullPath, join(basePath, item))
          } else if (extname(item) === '.bson') {
            const relativePath = join(basePath, item).replace(/\\/g, '/')
            const data = readFileSync(fullPath)
            resources.set(relativePath, data)
          }
        }
      }

      scanDir(resourcesPath)

      const resourceMap = {}
      resources.forEach((data, path) => {
        resourceMap[path] = Array.from(data)
      })

      const resourceCode = `
const serverlessResources = new Map(Object.entries(${JSON.stringify(resourceMap)}).map(([k, v]) => [k, new Uint8Array(v)]));
`

      for (const fileName in bundle) {
        if (bundle[fileName].type === 'chunk') {
          bundle[fileName].code = resourceCode + bundle[fileName].code
          bundle[fileName].code = bundle[fileName].code.replace(
            'let resourceData = null;',
            'let resourceData = serverlessResources;'
          )
        }
      }
    },
  }
}

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
        declaration: false,
        module: 'esnext',
        target: 'es2015',
      },
    },
  }),
  serverlessResourcePlugin(),
]

export default [
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.esm.js',
      format: 'es',
    },
    plugins,
  },
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.esm.min.js',
      format: 'es',
    },
    plugins: [...plugins, terser()],
  },
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.cjs.js',
      format: 'cjs',
      exports: 'named',
    },
    plugins,
  },
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
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.umd.min.js',
      format: 'umd',
      name: 'PhoneNumberValidator',
      exports: 'named',
    },
    plugins: [...plugins, terser()],
  },
]
