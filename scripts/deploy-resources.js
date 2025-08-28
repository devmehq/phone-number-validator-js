#!/usr/bin/env node

/**
 * Deploy phone number resources to various cloud platforms
 * Usage: node deploy-resources.js [platform] [options]
 */

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const readFile = promisify(fs.readFile)

const RESOURCES_DIR = path.join(__dirname, '..', 'resources')

async function getAllResourceFiles(dir = RESOURCES_DIR, basePath = '') {
  const files = []
  const items = await readdir(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const itemStat = await stat(fullPath)

    if (itemStat.isDirectory()) {
      const subFiles = await getAllResourceFiles(fullPath, path.join(basePath, item))
      files.push(...subFiles)
    } else if (path.extname(item) === '.bson') {
      files.push({
        path: path.join(basePath, item).replace(/\\/g, '/'),
        fullPath,
      })
    }
  }

  return files
}

// Deploy to Cloudflare KV
async function deployToCloudflareKV(namespace, apiToken, accountId) {
  console.log('Deploying to Cloudflare KV...')
  const files = await getAllResourceFiles()

  for (const file of files) {
    const key = `phone-validator:${file.path}`
    const data = await readFile(file.fullPath)

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespace}/values/${key}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: data,
      }
    )

    if (response.ok) {
      console.log(`✓ Uploaded ${file.path}`)
    } else {
      console.error(`✗ Failed to upload ${file.path}:`, await response.text())
    }
  }

  console.log('Cloudflare KV deployment complete!')
}

// Deploy to AWS S3
async function deployToS3(bucketName, region = 'us-east-1') {
  console.log('Deploying to AWS S3...')
  const AWS = require('aws-sdk')
  const s3 = new AWS.S3({ region })

  const files = await getAllResourceFiles()

  for (const file of files) {
    const key = `phone-validator/${file.path}`
    const data = await readFile(file.fullPath)

    try {
      await s3
        .putObject({
          Bucket: bucketName,
          Key: key,
          Body: data,
          ContentType: 'application/octet-stream',
          CacheControl: 'public, max-age=31536000',
        })
        .promise()

      console.log(`✓ Uploaded ${file.path}`)
    } catch (error) {
      console.error(`✗ Failed to upload ${file.path}:`, error.message)
    }
  }

  console.log('S3 deployment complete!')
}

// Deploy to CDN (using a generic HTTP PUT endpoint)
async function deployToCDN(endpoint, authHeader) {
  console.log('Deploying to CDN...')
  const files = await getAllResourceFiles()

  for (const file of files) {
    const data = await readFile(file.fullPath)
    const url = `${endpoint}/${file.path}`

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/octet-stream',
        },
        body: data,
      })

      if (response.ok) {
        console.log(`✓ Uploaded ${file.path}`)
      } else {
        console.error(`✗ Failed to upload ${file.path}:`, await response.text())
      }
    } catch (error) {
      console.error(`✗ Failed to upload ${file.path}:`, error.message)
    }
  }

  console.log('CDN deployment complete!')
}

// Generate a JSON manifest of all resources
async function generateManifest(outputFile = 'resources-manifest.json') {
  console.log('Generating resources manifest...')
  const files = await getAllResourceFiles()

  const manifest = {
    version: new Date().toISOString(),
    files: files.map((f) => ({
      path: f.path,
      size: fs.statSync(f.fullPath).size,
    })),
    totalFiles: files.length,
    totalSize: files.reduce((sum, f) => sum + fs.statSync(f.fullPath).size, 0),
  }

  fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2))
  console.log(`Manifest generated: ${outputFile}`)
  console.log(`Total files: ${manifest.totalFiles}`)
  console.log(`Total size: ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB`)
}

// Main CLI
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'cloudflare': {
      const namespace = process.env.CF_KV_NAMESPACE || args[1]
      const apiToken = process.env.CF_API_TOKEN || args[2]
      const accountId = process.env.CF_ACCOUNT_ID || args[3]

      if (!namespace || !apiToken || !accountId) {
        console.error('Usage: deploy-resources cloudflare [namespace] [api-token] [account-id]')
        console.error('Or set environment variables: CF_KV_NAMESPACE, CF_API_TOKEN, CF_ACCOUNT_ID')
        process.exit(1)
      }

      await deployToCloudflareKV(namespace, apiToken, accountId)
      break
    }

    case 's3': {
      const bucketName = process.env.AWS_S3_BUCKET || args[1]
      const region = process.env.AWS_REGION || args[2] || 'us-east-1'

      if (!bucketName) {
        console.error('Usage: deploy-resources s3 [bucket-name] [region]')
        console.error('Or set environment variables: AWS_S3_BUCKET, AWS_REGION')
        console.error('Make sure AWS credentials are configured')
        process.exit(1)
      }

      await deployToS3(bucketName, region)
      break
    }

    case 'cdn': {
      const endpoint = process.env.CDN_ENDPOINT || args[1]
      const authHeader = process.env.CDN_AUTH || args[2]

      if (!endpoint || !authHeader) {
        console.error('Usage: deploy-resources cdn [endpoint] [auth-header]')
        console.error('Or set environment variables: CDN_ENDPOINT, CDN_AUTH')
        process.exit(1)
      }

      await deployToCDN(endpoint, authHeader)
      break
    }

    case 'manifest': {
      const outputFile = args[1] || 'resources-manifest.json'
      await generateManifest(outputFile)
      break
    }

    default:
      console.log('Phone Number Validator - Resource Deployment Tool')
      console.log('')
      console.log('Usage: node deploy-resources.js [command] [options]')
      console.log('')
      console.log('Commands:')
      console.log('  cloudflare [namespace] [api-token] [account-id] - Deploy to Cloudflare KV')
      console.log('  s3 [bucket] [region]                            - Deploy to AWS S3')
      console.log('  cdn [endpoint] [auth]                           - Deploy to CDN endpoint')
      console.log('  manifest [output-file]                          - Generate resource manifest')
      console.log('')
      console.log('Environment variables:')
      console.log('  Cloudflare: CF_KV_NAMESPACE, CF_API_TOKEN, CF_ACCOUNT_ID')
      console.log('  AWS S3: AWS_S3_BUCKET, AWS_REGION (+ AWS credentials)')
      console.log('  CDN: CDN_ENDPOINT, CDN_AUTH')
      break
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
}

module.exports = {
  getAllResourceFiles,
  deployToCloudflareKV,
  deployToS3,
  deployToCDN,
  generateManifest,
}
