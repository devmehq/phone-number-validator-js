// AWS Lambda Function Example
// Deploy this as a Lambda function with Node.js 18+ runtime

import { parsePhoneNumber, geocoder, carrier, timezones } from '../../lib/serverless.esm.js'

export const handler = async (event) => {
  try {
    const { phoneNumber, countryCode } = JSON.parse(event.body || '{}')

    if (!phoneNumber) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Phone number is required' }),
      }
    }

    const parsed = parsePhoneNumber(phoneNumber, countryCode)

    if (!parsed || !parsed.isValid()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid phone number' }),
      }
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    }
  }
}

// Example deployment with AWS SAM template.yaml:
/*
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  PhoneValidatorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: .
      Handler: aws-lambda.handler
      Runtime: nodejs18.x
      MemorySize: 256
      Timeout: 10
      Events:
        Api:
          Type: Api
          Properties:
            Path: /validate
            Method: POST
*/
