import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage.js'

beforeEach(() => localStorage.clear())

test('returns initial value then persists updates', () => {
  const { result } = renderHook(() => useLocalStorage('k', { a: 1 }))
  expect(result.current[0]).toEqual({ a: 1 })
  act(() => result.current[1]({ a: 2 }))
  expect(result.current[0]).toEqual({ a: 2 })
  expect(JSON.parse(localStorage.getItem('k'))).toEqual({ a: 2 })
})

test('reads existing value from storage', () => {
  localStorage.setItem('k', JSON.stringify({ a: 99 }))
  const { result } = renderHook(() => useLocalStorage('k', { a: 1 }))
  expect(result.current[0]).toEqual({ a: 99 })
})
