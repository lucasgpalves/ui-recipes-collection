/**
 * Token demo — reexporta o decoder unificado (demo + JWT real).
 * Preferir importar de `shared/auth/tokenClaims` em código novo.
 */
export {
  createDemoToken,
  parseTokenClaims as parseDemoToken,
  roleFromToken,
  subjectFromToken,
  userIdFromToken,
  type TokenClaims as DemoTokenPayload,
} from '../shared/auth/tokenClaims'
