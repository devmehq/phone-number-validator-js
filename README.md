# 🎉 phone-number-validator-js Has Moved to a New Home!

**This repository is now archived and no longer maintained.**

The official, actively maintained version of **phone-number-validator-js** has moved to:

### 🚀 https://github.com/phone-check-app/phone-number-validator-js

We’re consolidating it under the `phone-check-app` organization to deliver faster updates, enhanced TypeScript support, modern tooling, and seamless integration with comprehensive phone validation datasets for carrier, geo, and timezone lookups.

### Why the new repo is better
- ✅ **Active development** with rapid PR reviews and issue triage  
- ✅ **Full TypeScript** with comprehensive `.d.ts` declarations and improved types  
- ✅ **Optimized performance** – LRU caching, BSON prefix loading, and serverless-ready builds (AWS Lambda, Cloudflare Workers, Vercel Edge, Deno)  
- ✅ **Rich features** – Format validation, carrier lookup, geolocation (city/country), timezone info, multi-locale support (EN, DE, ZH, etc.)  
- ✅ **Automated workflows** for testing, releases, and detailed changelogs  
- ✅ **Better error handling** and edge-case coverage for global phone numbers  

### Migration Guide (takes < 60 seconds)

#### npm / yarn / pnpm / bun
The package name has changed (now properly scoped):

```bash
# Remove the old package
npm uninstall @devmehq/phone-number-validator-js

# Install the new official package
npm install @phonecheck/phone-number-validator-js
```

**API is 100% compatible** – no code changes required! Your existing validation, lookup, and enrichment calls will work seamlessly.

#### Direct GitHub / raw file URLs
Update your links:

```diff
- https://github.com/devmehq/phone-number-validator-js
+ https://github.com/phone-check-app/phone-number-validator-js

- https://raw.githubusercontent.com/devmehq/phone-number-validator-js/main/dist/phone-number-validator.min.js
+ https://raw.githubusercontent.com/phone-check-app/phone-number-validator-js/main/dist/phone-number-validator.min.js
```

#### Git submodules
```bash
git submodule add https://github.com/phone-check-app/phone-number-validator-js.git
```

### Pro Tips for a Smooth Switch
- **Test it out:** Run your existing tests post-migration – everything from format checks to carrier lookups should pass unchanged.
- **Caching:** Clear your npm cache if you hit any resolution issues: `npm cache clean --force`.
- **Serverless users:** The new build includes optimized serverless bundles with external resource loading for even lighter payloads.
- **Locale support:** Explicitly set locales (e.g., `locale: 'de'`) for localized carrier names – defaults to English.

### Let's Keep Building Together! 🙌
- ⭐ **Star** the new repo to show your support: https://github.com/phone-check-app/phone-number-validator-js
- 🔔 **Watch** for releases and updates (go to Watch → Custom → Releases)

Huge thanks for choosing phone-number-validator-js – your usage has driven its evolution. We're thrilled for the next phase of global phone validation!

→ **New official repository**: https://github.com/phone-check-app/phone-number-validator-js
