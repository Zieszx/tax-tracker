import { renderHook, act } from '@testing-library/react'
import { ProfileProvider, useProfile } from './useProfile.js'

beforeEach(() => localStorage.clear())

test('importJson throws unified error on malformed JSON', () => {
  const { result } = renderHook(() => useProfile(), { wrapper: ProfileProvider })
  expect(() => result.current.importJson('not json')).toThrow('Invalid profile file')
})

test('importJson throws unified error on structurally-invalid JSON', () => {
  const { result } = renderHook(() => useProfile(), { wrapper: ProfileProvider })
  expect(() => result.current.importJson('{"foo":1}')).toThrow('Invalid profile file')
})

test('importJson throws when income.months is missing', () => {
  const { result } = renderHook(() => useProfile(), { wrapper: ProfileProvider })
  const noMonths = JSON.stringify({ income: {}, reliefs: [] })
  expect(() => result.current.importJson(noMonths)).toThrow('Invalid profile file')
})

test('importJson accepts a valid profile and updates state', () => {
  const { result } = renderHook(() => useProfile(), { wrapper: ProfileProvider })
  const valid = JSON.stringify({ income: { months: [] }, reliefs: [] })
  act(() => result.current.importJson(valid))
  expect(result.current.profile.income).toEqual({ months: [] })
  expect(result.current.profile.reliefs).toEqual([])
})
