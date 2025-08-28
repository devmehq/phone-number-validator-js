// Resource loader implementations for different serverless platforms

// ============================================
// Cloudflare Workers with KV Storage
// ============================================
export class CloudflareKVLoader {
  constructor(namespace) {
    this.namespace = namespace // Your KV namespace binding
  }

  async loadResource(path) {
    const key = `phone-validator:${path}`
    const data = await this.namespace.get(key, 'arrayBuffer')
    return data ? new Uint8Array(data) : null
  }
}

// Usage in Cloudflare Worker:
/*
import { setResourceLoader, parsePhoneNumber, geocoderAsync } from './serverless.lite.esm.js';

export default {
  async fetch(request, env) {
    setResourceLoader(new CloudflareKVLoader(env.PHONE_DATA));
    
    const { phoneNumber } = await request.json();
    const parsed = parsePhoneNumber(phoneNumber);
    const geo = await geocoderAsync(parsed);
    
    return Response.json({ geo });
  }
}
*/

// ============================================
// AWS Lambda with S3
// ============================================
export class S3ResourceLoader {
  constructor(s3Client, bucketName, prefix = 'phone-validator/') {
    this.s3 = s3Client
    this.bucket = bucketName
    this.prefix = prefix
  }

  async loadResource(path) {
    try {
      const response = await this.s3
        .getObject({
          Bucket: this.bucket,
          Key: this.prefix + path,
        })
        .promise()

      return new Uint8Array(response.Body)
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return null
      }
      throw error
    }
  }
}

// Usage in Lambda:
/*
import AWS from 'aws-sdk';
import { setResourceLoader, parsePhoneNumber, geocoderAsync } from './serverless.lite.esm.js';

const s3 = new AWS.S3();
const loader = new S3ResourceLoader(s3, 'my-bucket');

export const handler = async (event) => {
  setResourceLoader(loader);
  
  const { phoneNumber } = JSON.parse(event.body);
  const parsed = parsePhoneNumber(phoneNumber);
  const geo = await geocoderAsync(parsed);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ geo })
  };
};
*/

// ============================================
// Vercel Edge with Remote Fetch
// ============================================
export class RemoteFetchLoader {
  constructor(baseUrl, cacheTime = 3600) {
    this.baseUrl = baseUrl
    this.cacheTime = cacheTime
    this.cache = new Map()
  }

  async loadResource(path) {
    // Check cache first
    const cached = this.cache.get(path)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }

    try {
      const response = await fetch(`${this.baseUrl}/${path}`)
      if (!response.ok) {
        return null
      }

      const buffer = await response.arrayBuffer()
      const data = new Uint8Array(buffer)

      // Cache the result
      this.cache.set(path, {
        data,
        expires: Date.now() + this.cacheTime * 1000,
      })

      return data
    } catch (error) {
      console.error(`Failed to fetch resource: ${path}`, error)
      return null
    }
  }
}

// Usage in Vercel Edge Function:
/*
import { setResourceLoader, parsePhoneNumber, geocoderAsync } from './serverless.lite.esm.js';

const loader = new RemoteFetchLoader('https://cdn.example.com/phone-data');

export default async function handler(request) {
  setResourceLoader(loader);
  
  const { phoneNumber } = await request.json();
  const parsed = parsePhoneNumber(phoneNumber);
  const geo = await geocoderAsync(parsed);
  
  return Response.json({ geo });
}
*/

// ============================================
// Deno Deploy with Deno KV
// ============================================
export class DenoKVLoader {
  constructor(kv) {
    this.kv = kv // Deno.openKv() instance
  }

  async loadResource(path) {
    const key = ['phone-validator', path]
    const entry = await this.kv.get(key)
    return entry.value ? new Uint8Array(entry.value) : null
  }
}

// Usage in Deno Deploy:
/*
import { setResourceLoader, parsePhoneNumber, geocoderAsync } from './serverless.lite.esm.js';

const kv = await Deno.openKv();
const loader = new DenoKVLoader(kv);

Deno.serve(async (request) => {
  setResourceLoader(loader);
  
  const { phoneNumber } = await request.json();
  const parsed = parsePhoneNumber(phoneNumber);
  const geo = await geocoderAsync(parsed);
  
  return Response.json({ geo });
});
*/

// ============================================
// Bundled Resources Loader (Pre-loaded)
// ============================================
export class BundledResourceLoader {
  constructor(resources) {
    this.resources = resources // Map or object of path -> Uint8Array
  }

  async loadResource(path) {
    return this.resources.get ? this.resources.get(path) : this.resources[path] || null
  }

  loadResourceSync(path) {
    return this.resources.get ? this.resources.get(path) : this.resources[path] || null
  }
}

// Usage with pre-bundled resources:
/*
import { setResourceLoader, parsePhoneNumber, geocoder } from './serverless.lite.esm.js';
import resources from './bundled-resources.js';

const loader = new BundledResourceLoader(resources);
setResourceLoader(loader);

// Now you can use sync functions
const parsed = parsePhoneNumber('+14155552671');
const geo = geocoder(parsed); // Sync call
*/

// ============================================
// CDN with Edge Caching
// ============================================
export class CDNResourceLoader {
  constructor(cdnUrl, options = {}) {
    this.cdnUrl = cdnUrl
    this.headers = options.headers || {}
    this.timeout = options.timeout || 5000
  }

  async loadResource(path) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.cdnUrl}/${path}`, {
        headers: this.headers,
        signal: controller.signal,
        cf: {
          // Cloudflare specific caching
          cacheTtl: 3600,
          cacheEverything: true,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return null
      }

      const buffer = await response.arrayBuffer()
      return new Uint8Array(buffer)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.error(`Timeout loading resource: ${path}`)
      }
      return null
    }
  }
}

// ============================================
// Redis Resource Loader
// ============================================
export class RedisResourceLoader {
  constructor(redisClient, keyPrefix = 'phone:') {
    this.redis = redisClient
    this.keyPrefix = keyPrefix
  }

  async loadResource(path) {
    const key = this.keyPrefix + path
    const data = await this.redis.getBuffer(key)
    return data ? new Uint8Array(data) : null
  }
}

// ============================================
// Multi-tier Caching Loader
// ============================================
export class MultiTierLoader {
  constructor(loaders) {
    this.loaders = loaders // Array of loaders in priority order
  }

  async loadResource(path) {
    for (const loader of this.loaders) {
      try {
        const data = await loader.loadResource(path)
        if (data) {
          // Optionally populate higher-tier caches
          return data
        }
      } catch (error) {
        console.error(`Loader failed for ${path}:`, error)
      }
    }
    return null
  }
}

// Usage with multiple fallback sources:
/*
const loader = new MultiTierLoader([
  new BundledResourceLoader(cachedResources),  // L1: Memory
  new RedisResourceLoader(redis),               // L2: Redis
  new CDNResourceLoader('https://cdn.example.com/phone-data') // L3: CDN
]);
*/
