import fs from 'fs'

const en = JSON.parse(fs.readFileSync('locales/en/admin.json', 'utf8'))
const th = JSON.parse(fs.readFileSync('locales/th/admin.json', 'utf8'))
const zh = JSON.parse(fs.readFileSync('locales/zh/admin.json', 'utf8'))

const enKeys = Object.keys(en.withdrawalSettings || {}).sort()
const thKeys = Object.keys(th.withdrawalSettings || {}).sort()
const zhKeys = Object.keys(zh.withdrawalSettings || {}).sort()

console.log('EN keys:', enKeys.length)
console.log('TH keys:', thKeys.length)
console.log('ZH keys:', zhKeys.length)

const missingTH = enKeys.filter((k) => !thKeys.includes(k))
const missingZH = enKeys.filter((k) => !zhKeys.includes(k))
const extraTH = thKeys.filter((k) => !enKeys.includes(k))
const extraZH = zhKeys.filter((k) => !enKeys.includes(k))

if (missingTH.length) console.log('TH missing:', missingTH)
if (missingZH.length) console.log('ZH missing:', missingZH)
if (extraTH.length) console.log('TH has extra:', extraTH)
if (extraZH.length) console.log('ZH has extra:', extraZH)

if (!missingTH.length && !missingZH.length && !extraTH.length && !extraZH.length) {
  console.log('All locales have matching withdrawalSettings keys ✅')
}
