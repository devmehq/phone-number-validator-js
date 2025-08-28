const esbuild = require('rollup-plugin-esbuild').default
const { readFileSync } = require('fs')

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

module.exports = {
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
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
  plugins: [
    esbuild({
      include: /\.ts$/,
      exclude: /node_modules/,
      sourceMap: false,
      minify: false,
      target: 'es2015',
      tsconfig: './tsconfig.json',
      loaders: {
        '.ts': 'ts',
      },
    }),
  ],
}