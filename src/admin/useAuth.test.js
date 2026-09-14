import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
const mock = vi.hoisted(() => ({ getSession: vi.fn(), rpc: vi.fn(), callback: null }))
vi.mock('../lib/supabase', () => ({ supabase: {
  auth: { getSession: mock.getSession, onAuthStateChange: (callback) => { mock.callback = callback; return { data: { subscription: { unsubscribe() {} } } } } },
  rpc: mock.rpc,
} }))
import { useAuth } from './useAuth'
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

test('una sesión caducada que no responde no deja Cargando indefinidamente', async () => {
  vi.useFakeTimers()
  mock.getSession.mockReturnValue(new Promise(() => {}))
  const { result } = renderHook(() => useAuth())
  expect(result.current.ready).toBe(false)
  await act(async () => { await vi.advanceTimersByTimeAsync(10001) })
  expect(result.current.ready).toBe(true)
  expect(result.current.authError).toContain('Supabase')
  expect(result.current.isOwner).toBe(false)
})

test('una respuesta antigua no concede permisos después de cerrar sesión', async () => {
  let resolveOwner
  mock.getSession.mockResolvedValue({ data: { session: { user: { id: 'owner', email: 'entreramblasclavelyazahar@gmail.com' } } } })
  mock.rpc.mockReturnValue(new Promise((resolve) => { resolveOwner = resolve }))
  const { result } = renderHook(() => useAuth())
  await waitFor(() => expect(mock.rpc).toHaveBeenCalled())
  act(() => mock.callback('SIGNED_OUT', null))
  await waitFor(() => expect(result.current.ready).toBe(true))
  await act(async () => resolveOwner({ data: true }))
  expect(result.current.session).toBe(null)
  expect(result.current.isOwner).toBe(false)
})
