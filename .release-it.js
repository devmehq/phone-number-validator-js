const branch = process.env.BRANCH || process.env.CI_REF_NAME || ''
const branchSlug = branch.replace(/\//g, '-')
const branchPrefix = branch.split('/')[0]

const config = {
  isPreRelease: branch !== 'master',
  preRelease: branch !== 'master',
  preReleaseId: branch === 'master' ? '' : branch,
  npm: {
    skipChecks: true,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: {
        name: 'conventionalcommits',
        types: [
          { type: 'breaking', release: 'major' },
          { type: 'feat', release: 'minor' },
          // match anything else
          { type: '**', release: 'patch' },
          { subject: '**', release: 'patch' },
          { message: '**', release: 'patch' },
        ],
      },
    },
  },
}

console.debug('config', config)

module.exports = config
