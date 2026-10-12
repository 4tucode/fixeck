import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { ref, shallowRef } from 'vue'
import DashboardView from '@/views/DashboardView.vue'
import { notifyError, notifySuccess } from '@/utils/notify'
import { mountView } from './helpers'

// Funciones falsas que sustituyen a Firebase y al router (ver LoginView.test.js)
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  logout: vi.fn(),
  clockIn: vi.fn(),
  clockOut: vi.fn(),
  shift: null,
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ user: { value: { uid: 'uid-ana', email: 'ana@fixeck.test' } }, logout: mocks.logout }),
}))
// useShift devuelve el estado que prepara cada test en mocks.shift
vi.mock('@/composables/useShift', () => ({ useShift: () => mocks.shift }))
// El reloj del servidor se sustituye por el del dispositivo (que en los tests es el reloj falso)
vi.mock('@/utils/serverClock', () => ({ syncServerClock: vi.fn(), serverNow: () => new Date() }))
vi.mock('@/utils/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

// "Ahora" en todos los tests: 12 de octubre de 2026 a las 10:02:05
const NOW = new Date(2026, 9, 12, 10, 2, 5)

// Prepara el estado de la jornada que verá el panel.
// startedAt es la hora de entrada, o null si el empleado está fuera de jornada
function setShift({ startedAt = null, isLoading = false, hasError = false } = {}) {
  mocks.shift = {
    activeShift: shallowRef(startedAt ? { id: 'jornada-1', startedAt } : null),
    isLoading: ref(isLoading),
    hasError: ref(hasError),
    clockIn: mocks.clockIn,
    clockOut: mocks.clockOut,
  }
}

// Busca el botón principal de fichar (es el único con la clase de altura h-16)
function clockButton(wrapper) {
  return wrapper.find('button.h-16')
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reloj falso: permite fijar la hora y hacer avanzar el tiempo sin esperar de verdad
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => vi.useRealTimers())

  it('fuera de jornada muestra el estado, el contador a cero y el botón de entrada', () => {
    setShift()
    const wrapper = mountView(DashboardView)

    expect(wrapper.text()).toContain('Fuera de jornada')
    expect(wrapper.find('[role="timer"]').text()).toBe('00:00:00')
    expect(clockButton(wrapper).text()).toBe('Fichar entrada')
  })

  it('al fichar la entrada guarda el fichaje y avisa con la hora', async () => {
    setShift()
    mocks.clockIn.mockResolvedValue()
    const wrapper = mountView(DashboardView)

    await clockButton(wrapper).trigger('click')
    await flushPromises()

    expect(mocks.clockIn).toHaveBeenCalledOnce()
    expect(notifySuccess).toHaveBeenCalledWith('Entrada fichada a las 10:02. ¡Buena jornada!')
  })

  it('con la jornada abierta muestra el estado, el tiempo trabajado y la hora de entrada', () => {
    // Entró a las 09:00:00, hace 1 h 2 min 5 s
    setShift({ startedAt: new Date(2026, 9, 12, 9, 0, 0) })
    const wrapper = mountView(DashboardView)

    expect(wrapper.text()).toContain('Trabajando')
    expect(wrapper.find('[role="timer"]').text()).toBe('01:02:05')
    expect(wrapper.text()).toContain('Entrada a las 09:00')
    expect(clockButton(wrapper).text()).toBe('Fichar salida')
  })

  it('el contador avanza solo cada segundo', async () => {
    setShift({ startedAt: new Date(2026, 9, 12, 9, 0, 0) })
    const wrapper = mountView(DashboardView)

    await vi.advanceTimersByTimeAsync(3000)

    expect(wrapper.find('[role="timer"]').text()).toBe('01:02:08')
  })

  it('al fichar la salida cierra la jornada y avisa del tiempo trabajado', async () => {
    setShift({ startedAt: new Date(2026, 9, 12, 9, 0, 0) })
    mocks.clockOut.mockResolvedValue()
    const wrapper = mountView(DashboardView)

    await clockButton(wrapper).trigger('click')
    await flushPromises()

    expect(mocks.clockOut).toHaveBeenCalledOnce()
    expect(mocks.clockIn).not.toHaveBeenCalled()
    expect(notifySuccess).toHaveBeenCalledWith('Salida fichada. Has trabajado 1 h 2 min.')
  })

  it('si falla el guardado avisa del error y vuelve a activar el botón', async () => {
    setShift()
    mocks.clockIn.mockRejectedValue(new Error('sin conexión'))
    const wrapper = mountView(DashboardView)

    await clockButton(wrapper).trigger('click')
    await flushPromises()

    expect(notifyError).toHaveBeenCalledWith('No hemos podido guardar el fichaje. Inténtalo de nuevo.')
    expect(clockButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('mientras carga la jornada no deja fichar', () => {
    setShift({ isLoading: true })
    const wrapper = mountView(DashboardView)

    expect(wrapper.text()).toContain('Cargando tu jornada')
    expect(clockButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('si no hay conexión con el servidor lo avisa y no deja fichar', () => {
    setShift({ hasError: true })
    const wrapper = mountView(DashboardView)

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(clockButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('al salir de la pantalla detiene el cronómetro', () => {
    setShift()
    const wrapper = mountView(DashboardView)
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
  })

  it('cerrar sesión sale de la cuenta y lleva al login', async () => {
    setShift()
    mocks.logout.mockResolvedValue()
    const wrapper = mountView(DashboardView)

    await wrapper.findAll('button').find((button) => button.text() === 'Cerrar sesión').trigger('click')
    await flushPromises()

    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledWith({ name: 'login' })
  })
})
