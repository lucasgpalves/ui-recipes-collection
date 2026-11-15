import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const repoRoot = path.resolve(uiRoot, '..')

function read(relativeFromRepo: string): string {
  return readFileSync(path.resolve(relativeFromRepo), 'utf8')
}

describe('defaults de release (AC-13 / RF-UI-API-10 / RNF-UI-API-06)', () => {
  it('ui/.env.example usa VITE_USE_DEMO_API=false', () => {
    expect(read(path.join(uiRoot, '.env.example'))).toMatch(/^VITE_USE_DEMO_API=false$/m)
  })

  it('.env.example da raiz usa VITE_USE_DEMO_API=false', () => {
    expect(read(path.join(repoRoot, '.env.example'))).toMatch(/^VITE_USE_DEMO_API=false$/m)
  })

  it('docker-compose.yaml de release defaulta VITE_USE_DEMO_API=false', () => {
    expect(read(path.join(repoRoot, 'docker-compose.yaml'))).toMatch(
      /VITE_USE_DEMO_API:\s*\$\{VITE_USE_DEMO_API:-false\}/,
    )
  })

  it('imagem Docker defaulta ARG VITE_USE_DEMO_API=false', () => {
    expect(read(path.join(uiRoot, 'docker/Dockerfile.frontend'))).toMatch(
      /^ARG VITE_USE_DEMO_API=false$/m,
    )
  })

  it('compose do frontend defaulta VITE_USE_DEMO_API=false', () => {
    expect(read(path.join(uiRoot, 'docker/docker-compose.yml'))).toMatch(
      /VITE_USE_DEMO_API:\s*\$\{VITE_USE_DEMO_API:-false\}/,
    )
  })
})
