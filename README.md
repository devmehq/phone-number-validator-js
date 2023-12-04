# Phone Number information lookup, validation,  carrier name, geo and timezone infos

[![NPM version](https://badgen.net/npm/v/@devmehq/phone-number-validator-js)](https://npm.im/@devmehq/phone-number-validator-js)
[![Build Status](https://github.com/devmehq/phone-number-validator-js/workflows/CI/badge.svg)](https://github.com/devmehq/phone-number-validator-js/actions)
[![Downloads](https://img.shields.io/npm/dm/phone-number-validator-js.svg)](https://www.npmjs.com/package/phone-number-validator-js)
[![UNPKG](https://img.shields.io/badge/UNPKG-OK-179BD7.svg)](https://unpkg.com/browse/@devmehq/phone-number-validator-js@latest/)

### Verify phone number, validate format, checking carrier name, geo and timezone infos.

> This library includes phone number lookup and validation, and the geocoding, carrier mapping and timezone mapping functionalities that are available in some of googles [libphonenumber](https://github.com/google/libphonenumber) libraries.
> 
> To reduce the amount of data that needs to be loaded to geocode / carrier map a phone-number for each mapping only the relevant number prefixes are loaded from a binary json file (BSON).
 When the prefix could not be found in the provided locale the library tries to fall back to `en` as locale.
> 
> The library supports Node.js only at the moment.


## Features
✅ Check phone number validity

✅ Check phone number format

✅ Check phone number carrier name

✅ Check phone number geo location (city)

✅ Check phone number timezone

✅ Check phone number country code


## Use cases
- Increase delivery rate of SMS campaigns by removing invalid phone numbers
- Increase SMS open rate and your marketing IPs reputation
- Protect your website from spam, bots and fake phone numbers
- Protect your product signup form from fake phone numbers
- Protect your website forms from fake phone numbers
- Protect your self from fraud orders and accounts using fake phone numbers
- Integrate phone number verification into your website forms
- Integrate phone number verification into your backoffice administration and order processing
- Integrate phone number verification into your mobile apps

## API / Cloud Hosted Service
We offer this `phone verification and validation and more advanced features` in our Scalable Cloud API Service Offering - You could try it here [Phone Number Verification](https://dev.me/products/phone)

## Self-hosting - installation and usage instructions

## Installation

```sh
npm install @devmehq/phone-number-validator-js
```

or

```sh
yarn add @devmehq/phone-number-validator-js
```

## Usage

The available methods are:

- `geocoder(phonenumber: PhoneNumber, locale?: GeocoderLocale = 'en'): Promise<string | null>` - Resolved to the geocode or null if no geocode could be found (e.g. for mobile numbers)
- `carrier(phonenumber: PhoneNumber, locale?: CarrierLocale = 'en'): Promise<string | null>` - Resolves to the carrier or null if non could be found (e.g. for fixed line numbers)
- `timezones(phonenumber: PhoneNumber): Promise<Array<string> | null>` - Resolved to an array of timezones or null if non where found.

## Examples

```js
import { geocoder, carrier, timezones, parsePhoneNumberFromString } from '@devmehq/phone-number-validator-js'

const fixedLineNumber = parsePhoneNumberFromString('+41431234567')
const locationEN = geocoder(fixedLineNumber) // Zurich
const locationDE = geocoder(fixedLineNumber, 'de') // Zürich
const locationIT = geocoder(fixedLineNumber, 'it') // Zurigo

const mobileNumber = parsePhoneNumberFromString('+8619912345678')
const carrierEN = carrier(mobileNumber) // China Telecom
const carrierZH = carrier(mobileNumber, 'zh') // 中国电信

const fixedLineNumber2 = parsePhoneNumberFromString('+49301234567')
const tzones = timezones(fixedLineNumber2) // ['Europe/Berlin']
```
