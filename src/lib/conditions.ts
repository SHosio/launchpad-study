import type { ConditionA, ConditionB } from './types'

/**
 * Opaque URL codes for condition assignment.
 * Participants see ?v=xR7qL instead of ?condition_a=A1&condition_b=B1
 */
const VARIANT_MAP: Record<string, { a: ConditionA; b: ConditionB }> = {
  xR7qL: { a: 'A1', b: 'B1' },
  mK3wP: { a: 'A2', b: 'B1' },
  vN8jT: { a: 'A1', b: 'B2' },
  pQ5cY: { a: 'A2', b: 'B2' },
}

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(VARIANT_MAP).map(([code, { a, b }]) => [`${a}_${b}`, code])
)

export function decodeVariant(code: string | null): { a: ConditionA; b: ConditionB } | null {
  if (!code) return null
  return VARIANT_MAP[code] || null
}

export function getVariantCode(a: ConditionA, b: ConditionB): string {
  return REVERSE_MAP[`${a}_${b}`]
}

export const ALL_VARIANTS = Object.entries(VARIANT_MAP).map(([code, { a, b }]) => ({
  code,
  a,
  b,
}))
