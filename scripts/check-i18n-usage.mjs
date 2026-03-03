import fs from 'fs'

const en = JSON.parse(fs.readFileSync('locales/en/admin.json', 'utf8'))
const pageKeysRaw = fs.readFileSync('/tmp/page_keys.txt', 'utf8').trim().split('\n')
const pageKeys = pageKeysRaw.map(k => k.trim()).filter(Boolean)

const localeKeys = Object.keys(en.withdrawalSettings || {})

const missingInLocale = pageKeys.filter(k => !localeKeys.includes(k))
const unusedInLocale = localeKeys.filter(k => !pageKeys.includes(k))

if (missingInLocale.length) console.log('MISSING in locale (used in page but not in JSON):', missingInLocale)
if (unusedInLocale.length) console.log('UNUSED in locale (in JSON but not used in page):', unusedInLocale)
if (!missingInLocale.length) console.log('All page keys exist in locale ✅')
if (!unusedInLocale.length) console.log('No unused keys ✅')
