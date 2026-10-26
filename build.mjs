import { cpSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const dist = join(root, 'dist')

rmSync(dist, { recursive: true, force: true })
cpSync(join(root, 'site'), dist, { recursive: true })
