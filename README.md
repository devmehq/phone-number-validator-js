# Phone Number information lookup, validation,  carrier name, geo and timezone infos

[![NPM version](https://badgen.net/npm/v/@devmehq/phonenumber-js)](https://npm.im/@devmehq/phonenumber-js)
[![Build Status](https://github.com/devmehq/phonenumber-js/workflows/CI/badge.svg)](https://github.com/devmehq/phonenumber-js/actions)
[![Downloads](https://img.shields.io/npm/dm/phonenumber-js.svg)](https://www.npmjs.com/package/phonenumber-js)
[![UNPKG](https://img.shields.io/badge/UNPKG-OK-179BD7.svg)](https://unpkg.com/browse/@devmehq/phonenumber-js@latest/)

This library includes the geocoding, carrier mapping and timezone mapping functionalities that are available in some of googles [libphonenumber](https://github.com/google/phonenumber-js) libraries but not in [libphonenumber-js](https://gitlab.com/catamphetamine/phonenumber-js) (a port of libphonenumber).

To reduce the amount of data that needs to be loaded to geocode / carrier map a phonenumber for each mapping only the relevant number prefixes are loaded from a binary json file (BSON).
When the prefix could not be found in the provided locale the library tries to fallback to `en` as locale.
The library supports Node.js only at the moment.

## API / Cloud Hosted Service
We offer this `phone verification and validation and more advanced features` in our Scalable Cloud API Service Offering - You could try it here [Phone Number Verification](https://dev.me/products/phone)


## Self-hosting - installation and usage instructions

## Installation

```sh
npm install @devmehq/phonenumber-js
```

or

```sh
yarn add @devmehq/phonenumber-js
```

## Usage

The available methods are:

- `geocoder(phonenumber: PhoneNumber, locale?: GeocoderLocale = 'en'): Promise<string | null>` - Resolved to the geocode or null if no geocode could be found (e.g. for mobile numbers)
- `carrier(phonenumber: PhoneNumber, locale?: CarrierLocale = 'en'): Promise<string | null>` - Resolves to the carrier or null if non could be found (e.g. for fixed line numbers)
- `timezones(phonenumber: PhoneNumber): Promise<Array<string> | null>` - Resolved to an array of timezones or null if non where found.

## Examples

```js
import { geocoder, carrier, timezones, parsePhoneNumberFromString } from '@devmehq/phonenumber-js'

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
