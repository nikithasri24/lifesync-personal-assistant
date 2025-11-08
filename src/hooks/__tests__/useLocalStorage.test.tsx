import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useLocalStorage, useSessionStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('reads initial value and writes to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('key1', 123))
    expect(result.current[0]).toBe(123)
    act(() => result.current[1](456))
    expect(JSON.parse(localStorage.getItem('key1') || '0')).toBe(456)
    expect(result.current[0]).toBe(456)
  })

  it('supports functional update', () => {
    const { result } = renderHook(() => useLocalStorage('key2', 1))
    act(() => result.current[1]((v) => v + 4))
    expect(result.current[0]).toBe(5)
  })

  it('removes value', () => {
    const { result } = renderHook(() => useLocalStorage('key3', 'a'))
    act(() => result.current[1]('b'))
    act(() => result.current[2]())
    expect(localStorage.getItem('key3')).toBeNull()
    expect(result.current[0]).toBe('a')
  })
})

describe('useSessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('reads initial and writes to sessionStorage', () => {
    const { result } = renderHook(() => useSessionStorage('skey', { x: 1 }))
    expect(result.current[0]).toEqual({ x: 1 })
    act(() => result.current[1]({ x: 2 }))
    expect(JSON.parse(sessionStorage.getItem('skey') || '{}')).toEqual({ x: 2 })
  })
})

