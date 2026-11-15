import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function sourceFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'test-support') continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...sourceFiles(full))
      continue
    }
    if (/\.(ts|tsx)$/.test(entry) && !entry.includes('.test.')) files.push(full)
  }
  return files
}

describe('RNF-UI-API-01: frontend sem chave privada JWT', () => {
  it('não há PEM de chave privada no código da UI', () => {
    const offenders = sourceFiles(srcRoot).filter((file) => {
      const text = readFileSync(file, 'utf8')
      return text.includes('BEGIN PRIVATE KEY') || text.includes('BEGIN RSA PRIVATE KEY')
    })
    expect(offenders).toEqual([])
  })
})
