import typescript from 'rollup-plugin-typescript2'
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs'
import { join, extname } from 'path'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'
import { gzipSync } from 'zlib'

function serverlessResourcePlugin() {
  return {
    name: 'serverless-resource',
    generateBundle(options, bundle) {
      const resourcesPath = join(__dirname, 'resources')
      const resources = new Map()

      function scanDir(dir, basePath = '') {
        if (!existsSync(dir)) {
          console.warn(`Resources directory not found: ${dir}`)
          return
        }

        const items = readdirSync(dir)
        for (const item of items) {
          const fullPath = join(dir, item)
          const stat = statSync(fullPath)

          if (stat.isDirectory()) {
            scanDir(fullPath, join(basePath, item))
          } else if (extname(item) === '.bson') {
            const relativePath = join(basePath, item).replace(/\\/g, '/')
            const data = readFileSync(fullPath)
            // Compress the data with gzip
            const compressed = gzipSync(data, { level: 9 })
            resources.set(relativePath, compressed)
          }
        }
      }

      scanDir(resourcesPath)

      // Convert resources to base64 strings for smaller JSON representation
      const resourceMap = {}
      let totalSize = 0
      let compressedSize = 0

      resources.forEach((data, path) => {
        const originalSize = data.length
        const base64 = data.toString('base64')
        resourceMap[path] = base64
        totalSize += originalSize
        compressedSize += base64.length
      })

      console.log(
        `Resource compression: ${(totalSize / 1024 / 1024).toFixed(2)}MB -> ${(compressedSize / 1024 / 1024).toFixed(2)}MB`
      )

      // Create a decompression function to be included in the bundle
      const resourceCode = `
import { ungzipSync } from 'fflate';

const compressedResources = ${JSON.stringify(resourceMap)};
const serverlessResources = new Map();

// Decompress resources on first access
function getResource(path) {
  if (!serverlessResources.has(path)) {
    const base64 = compressedResources[path];
    if (base64) {
      const compressed = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const decompressed = ungzipSync(compressed);
      serverlessResources.set(path, decompressed);
    }
  }
  return serverlessResources.get(path);
}

// Override the resourceData access
const resourceDataProxy = new Proxy(new Map(), {
  get(target, prop) {
    if (prop === 'get') {
      return (path) => getResource(path);
    }
    if (prop === 'has') {
      return (path) => path in compressedResources;
    }
    return target[prop];
  }
});
`

      for (const fileName in bundle) {
        if (bundle[fileName].type === 'chunk') {
          bundle[fileName].code = resourceCode + bundle[fileName].code
          bundle[fileName].code = bundle[fileName].code.replace(
            'let resourceData = null;',
            'let resourceData = resourceDataProxy;'
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
        target: 'es2017',
      },
    },
  }),
  serverlessResourcePlugin(),
]

export default [
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.optimized.esm.js',
      format: 'es',
    },
    external: ['fflate'],
    plugins,
  },
  {
    input: 'src/index.serverless.ts',
    output: {
      file: 'lib/serverless.optimized.esm.min.js',
      format: 'es',
      plugins: [
        terser({
          compress: {
            drop_console: true,
            passes: 2,
          },
          mangle: true,
        }),
      ],
    },
    external: ['fflate'],
    plugins,
  },
]
