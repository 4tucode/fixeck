import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDocFromServer, setDoc } from 'firebase/firestore'
import { serverNow, syncServerClock } from '@/utils/serverClock'

// Firestore se sustituye por funciones falsas: no se conecta a ningún servidor
vi.mock('@/firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
  getDocFromServer: vi.fn(),
}))

// Hora del dispositivo en los tests: 10:00:00
const DEVICE_TIME = new Date(2026, 9, 12, 10, 0, 0)

// Hace que el servidor falso responda con la hora indicada
function serverAnswersWith(date) {
  setDoc.mockResolvedValue()
  getDocFromServer.mockResolvedValue({ data: () => ({ syncedAt: { toMillis: () => date.getTime() } }) })
}

describe('serverClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(DEVICE_TIME)
  })

  afterEach(() => vi.useRealTimers())

  it('corrige la hora si el reloj del dispositivo va atrasado', async () => {
    // El servidor va hora y media por delante del dispositivo
    serverAnswersWith(new Date(2026, 9, 12, 11, 30, 0))

    await syncServerClock('uid-ana')

    expect(serverNow()).toEqual(new Date(2026, 9, 12, 11, 30, 0))
  })

  it('corrige la hora si el reloj del dispositivo va adelantado', async () => {
    serverAnswersWith(new Date(2026, 9, 12, 9, 55, 0))

    await syncServerClock('uid-ana')

    expect(serverNow()).toEqual(new Date(2026, 9, 12, 9, 55, 0))
  })

  it('si no puede preguntar al servidor usa la hora del dispositivo', async () => {
    setDoc.mockRejectedValue(new Error('sin conexión'))

    await syncServerClock('uid-ana')

    expect(serverNow()).toEqual(DEVICE_TIME)
  })
})
