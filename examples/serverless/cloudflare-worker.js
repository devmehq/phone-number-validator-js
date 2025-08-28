// Cloudflare Worker Example
// Deploy this using Wrangler CLI or Cloudflare Dashboard

import { parsePhoneNumber, geocoder, carrier, timezones } from '../../lib/serverless.esm.js'

export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const { phoneNumber, countryCode } = await request.json()

      if (!phoneNumber) {
        return new Response(JSON.stringify({ error: 'Phone number is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      const parsed = parsePhoneNumber(phoneNumber, countryCode)

      if (!parsed || !parsed.isValid()) {
        return new Response(JSON.stringify({ error: 'Invalid phone number' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      const result = {
        valid: true,
        number: {
          international: parsed.formatInternational(),
          national: parsed.formatNational(),
          e164: parsed.format('E.164'),
          rfc3966: parsed.format('RFC3966'),
        },
        country: parsed.country,
        countryCallingCode: parsed.countryCallingCode,
        nationalNumber: parsed.nationalNumber,
        type: parsed.getType(),
        geocoder: geocoder(parsed),
        carrier: carrier(parsed),
        timezones: timezones(parsed),
      }

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  },
}

// Example wrangler.toml configuration:
/*
name = "phone-validator"
main = "cloudflare-worker.js"
compatibility_date = "2023-05-18"

[env.production]
routes = [
  { pattern = "api.example.com/phone-validate", zone_id = "YOUR_ZONE_ID" }
]
*/
