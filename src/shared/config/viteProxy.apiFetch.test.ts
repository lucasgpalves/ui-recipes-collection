import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

describe('proxy Vite de desenvolvimento (RF-UI-API-03)', () => {
  it('aponta para VITE_API_PROXY_TARGET com default localhost:8080 e reescreve /api', async () => {
    const source = readFileSync(path.join(uiRoot, 'vite.config.ts'), 'utf8')
    expect(source).toContain('VITE_API_PROXY_TARGET')
    expect(source).toContain('http://localhost:8080')

    const configMod = await import('../../../vite.config')
    const define = configMod.default as (env: {
      mode: string
      command: 'serve' | 'build'
    }) => Promise<{
      server?: {
        proxy?: Record<string, { target?: string; rewrite?: (path: string) => string } | string>
      }
    }>
    const resolved = await define({ mode: 'development', command: 'serve' })
    const proxy = resolved.server?.proxy?.['/api']

    expect(typeof proxy).toBe('object')
    if (typeof proxy === 'object' && proxy) {
      expect(proxy.target).toBe('http://localhost:8080')
      expect(proxy.rewrite?.('/api')).toBe('')
      expect(proxy.rewrite?.('/api/auth/login')).toBe('/auth/login')
    }
  })
})
