import { execFileSync } from 'node:child_process'

const registries = ['https://registry.npmmirror.com/', 'https://registry.npm.taobao.org/']

for (const registry of registries) {
  try {
    execFileSync('pnpm', ['config', 'set', 'registry', registry], { stdio: 'ignore' })
    process.exit(0)
  } catch {
    continue
  }
}
