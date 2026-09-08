import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../src/data/stations.ts', import.meta.url),
  'utf8',
)
const records = [...source.matchAll(/^  \{ id: '([^']+)', name: (.+) \},$/gm)].map(
  ([, id, name]) => ({ id, name }),
)

if (records.length !== 272) {
  throw new Error(`Expected 272 Tube stations, found ${records.length}`)
}

const ids = new Set(records.map(({ id }) => id))
const names = new Set(records.map(({ name }) => name))
if (ids.size !== records.length || names.size !== records.length) {
  throw new Error('Tube station IDs and display names must both be unique')
}

if (!source.includes("tubeStationCatalogueCapturedAt = '2026-09-08'")) {
  throw new Error('Tube station catalogue capture date is missing')
}

console.log(`Catalogue guard passed: ${records.length} unique Tube stations`)
