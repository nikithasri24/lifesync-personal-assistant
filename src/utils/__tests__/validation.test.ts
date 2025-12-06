import { describe, it, expect } from 'vitest'
import { validateField, validateForm, validationRules, getFieldClassName } from '../validation'

describe('validation utils', () => {
  it('validateField handles required, min/max and pattern', () => {
    expect(validateField('', { required: true })).toBeTruthy()
    expect(validateField('ok', { required: true })).toBeNull()
    expect(validateField(3, { min: 5 })).toMatch(/at least 5/)
    expect(validateField(10, { max: 8 })).toMatch(/not exceed 8/)
    expect(validateField('abc', { pattern: /^\d+$/ })).toBe('Invalid format')
  })

  it('validateForm aggregates errors', () => {
    const data = { email: 'bad', amount: -1 }
    const rules = { email: validationRules.email, amount: validationRules.currency }
    const result = validateForm(data, rules)
    expect(result.isValid).toBe(false)
    expect(Object.keys(result.errors).length).toBeGreaterThan(0)
  })

  it('getFieldClassName toggles error styles', () => {
    const ok = getFieldClassName()
    const bad = getFieldClassName('Error!')
    expect(ok).toMatch(/focus:ring-blue/)
    expect(bad).toMatch(/focus:ring-red/)
  })
})

