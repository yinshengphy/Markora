import { existsSync } from 'node:fs'
import { appendFile, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const marker = 'ElectronDownloadCacheMode'
const patch = `

// Compatibility shim for electron-builder 26.15.x, whose app-builder-lib
// expects the cache mode enum from newer @electron/get versions.
if (!exports.ElectronDownloadCacheMode) {
  exports.ElectronDownloadCacheMode = {
    0: 'ReadWrite',
    1: 'ReadOnly',
    2: 'WriteOnly',
    3: 'Bypass',
    ReadWrite: 0,
    ReadOnly: 1,
    WriteOnly: 2,
    Bypass: 3,
  };
}
`

const pnpmDirectory = join(process.cwd(), 'node_modules', '.pnpm')

async function findElectronGetEntrypoints() {
  if (!existsSync(pnpmDirectory)) return []
  const entries = await readdir(pnpmDirectory)
  return entries
    .filter((entry) => entry.startsWith('@electron+get@3.'))
    .map((entry) => join(pnpmDirectory, entry, 'node_modules', '@electron', 'get', 'dist', 'cjs', 'index.js'))
    .filter((entrypoint) => existsSync(entrypoint))
}

for (const entrypoint of await findElectronGetEntrypoints()) {
  const source = await readFile(entrypoint, 'utf8')
  if (source.includes(marker)) continue
  await appendFile(entrypoint, patch, 'utf8')
  console.log(`Patched ${entrypoint}`)
}
