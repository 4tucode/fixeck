import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { computed, ref, shallowRef } from 'vue'
import DashboardView from '@/views/DashboardView.vue'
import { notifyError, notifySuccess } from '@/utils/notify'
import { mountView } from './helpers'

// Funciones falsas que sustituyen a Firebase y al router (ver LoginView.test.js)
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  logout: vi.fn(),
  clockIn: vi.fn(),
  clockOut: vi.fn(),
  startBreak: vi.fn(),
  endBreak: vi.fn(),
  shift: null,
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ user: { value: { uid: 'uid-ana', email: 'ana@fixeck.test' } }, logout: mocks.logout }),
}))
// useShift devuelve el estado que prepara cada test en mocks.shift
vi.mock('@/composables/useShift', () => ({ useShift: () => mocks.shift }))
// El reloj del servidor se sustituye por el del dispositivo (que en los tests es el reloj falso)
// El aviso de verificar el correo tiene sus propios tests; aquí se sustituye por un hueco vacío
vi.mock('@/components/VerifyEmailBanner.vue', () => ({ default: { render: () => null } }))
vi.mock('@/utils/serverClock', () => ({ syncServerClock: vi.fn(), serverNow: () => new Date() }))
vi.mock('@/utils/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

// "Ahora" en todos los tests: 12 de octubre de 2026 a las 10:02:05
const NOW = new Date(2026, 9, 12, 10, 2, 5)

// Hora de entrada habitual en los tests: las 09:00:00, hace 1 h 2 min 5 s
const NINE = new Date(2026, 9, 12, 9, 0, 0)

// Prepara el estado de la jornada que verá el panel.
//   - startedAt: hora de entrada, o null si el empleado está fuera de jornada
//   - breaks: pausas de la jornada, como [{ startedAt, endedAt }]
function setShift({ startedAt = null, breaks = [], isLoading = false, hasError = false } = {}) {
  const breakList = breaks.map((pause, index) => ({ id: `pausa-${index}`, shiftId: 'jornada-1', ...pause }))
  mocks.shift = {
    activeShift: shallowRef(startedAt ? { id: 'jornada-1', startedAt, endedAt: null } : null),
    breaks: shallowRef(breakList),
    openBreak: computed(() => breakList.find((pause) => pause.endedAt === null) ?? null),
    isLoading: ref(isLoading),
    hasError: ref(hasError),
    clockIn: mocks.clockIn,
    clockOut: mocks.clockOut,
    startBreak: mocks.startBreak,
    endBreak: mocks.endBreak,
  }
}

// Devuelve el botón que tiene exactamente ese texto (undefined si no está en pantalla)
function button(wrapper, text) {
  return wrapper.findAll('button').find((item) => item.text() === text)
}

// Pulsa el botón con ese texto y espera a que termine el guardado
async function press(wrapper, text) {
  await button(wrapper, text).trigger('click')
  await flushPromises()
}

function timerText(wrapper) {
  return wrapper.find('[role="timer"]').text()
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reloj falso: permite fijar la hora y hacer avanzar el tiempo sin esperar de verdad
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => vi.useRealTimers())

  describe('fuera de jornada', () => {
    it('muestra el estado, el contador a cero y solo el botón de entrada', () => {
      setShift()
      const wrapper = mountView(DashboardView)

      expect(wrapper.text()).toContain('Fuera de jornada')
      expect(timerText(wrapper)).toBe('00:00:00')
      expect(button(wrapper, 'Fichar entrada')).toBeDefined()
      expect(button(wrapper, 'Pausar')).toBeUndefined()
    })

    it('al fichar la entrada guarda el fichaje y avisa con la hora', async () => {
      setShift()
      mocks.clockIn.mockResolvedValue()
      const wrapper = mountView(DashboardView)

      await press(wrapper, 'Fichar entrada')

      expect(mocks.clockIn).toHaveBeenCalledOnce()
      expect(notifySuccess).toHaveBeenCalledWith('Entrada fichada a las 10:02. ¡Buena jornada!')
    })
  })

  describe('trabajando', () => {
    it('muestra el estado, el tiempo trabajado y la hora de entrada', () => {
      setShift({ startedAt: NINE })
      const wrapper = mountView(DashboardView)

      expect(wrapper.text()).toContain('Trabajando')
      expect(timerText(wrapper)).toBe('01:02:05')
      expect(wrapper.text()).toContain('Entrada a las 09:00')
      expect(button(wrapper, 'Fichar salida')).toBeDefined()
      expect(button(wrapper, 'Pausar')).toBeDefined()
    })

    it('el contador avanza solo cada segundo', async () => {
      setShift({ startedAt: NINE })
      const wrapper = mountView(DashboardView)

      await vi.advanceTimersByTimeAsync(3000)

      expect(timerText(wrapper)).toBe('01:02:08')
    })

    it('descuenta del contador las pausas ya terminadas', () => {
      // Una pausa de 20 minutos, de 09:20 a 09:40
      setShift({
        startedAt: NINE,
        breaks: [{ startedAt: new Date(2026, 9, 12, 9, 20), endedAt: new Date(2026, 9, 12, 9, 40) }],
      })
      const wrapper = mountView(DashboardView)

      expect(timerText(wrapper)).toBe('00:42:05')
    })

    it('al fichar la salida cierra la jornada y avisa del tiempo trabajado', async () => {
      setShift({ startedAt: NINE })
      mocks.clockOut.mockResolvedValue()
      const wrapper = mountView(DashboardView)

      await press(wrapper, 'Fichar salida')

      expect(mocks.clockOut).toHaveBeenCalledOnce()
      expect(mocks.clockIn).not.toHaveBeenCalled()
      expect(notifySuccess).toHaveBeenCalledWith('Salida fichada. Has trabajado 1 h 2 min.')
    })

    it('al pausar guarda la pausa y avisa', async () => {
      setShift({ startedAt: NINE })
      mocks.startBreak.mockResolvedValue()
      const wrapper = mountView(DashboardView)

      await press(wrapper, 'Pausar')

      expect(mocks.startBreak).toHaveBeenCalledOnce()
      expect(notifySuccess).toHaveBeenCalledWith('Pausa iniciada. ¡Buen descanso!')
    })
  })

  describe('en pausa', () => {
    // Entró a las 09:00 y está en pausa desde las 09:50: trabajó 50 minutos y lleva 12 min 5 s parado
    const onBreak = { startedAt: NINE, breaks: [{ startedAt: new Date(2026, 9, 12, 9, 50), endedAt: null }] }

    it('muestra el estado, desde cuándo y cuánto dura la pausa', () => {
      setShift(onBreak)
      const wrapper = mountView(DashboardView)

      expect(wrapper.text()).toContain('En pausa')
      expect(wrapper.text()).toContain('En pausa desde las 09:50 · 00:12:05')
      expect(button(wrapper, 'Reanudar')).toBeDefined()
      expect(button(wrapper, 'Pausar')).toBeUndefined()
    })

    it('el tiempo trabajado se detiene y solo avanza el de la pausa', async () => {
      setShift(onBreak)
      const wrapper = mountView(DashboardView)
      expect(timerText(wrapper)).toBe('00:50:00')

      await vi.advanceTimersByTimeAsync(5000)

      expect(timerText(wrapper)).toBe('00:50:00')
      expect(wrapper.text()).toContain('00:12:10')
    })

    it('al reanudar cierra la pausa y avisa de lo que ha durado', async () => {
      setShift(onBreak)
      mocks.endBreak.mockResolvedValue()
      const wrapper = mountView(DashboardView)

      await press(wrapper, 'Reanudar')

      expect(mocks.endBreak).toHaveBeenCalledOnce()
      expect(notifySuccess).toHaveBeenCalledWith('De vuelta al trabajo. La pausa ha durado 12 min.')
    })

    it('se puede fichar la salida sin reanudar, contando solo lo trabajado', async () => {
      setShift(onBreak)
      mocks.clockOut.mockResolvedValue()
      const wrapper = mountView(DashboardView)

      await press(wrapper, 'Fichar salida')

      expect(mocks.clockOut).toHaveBeenCalledOnce()
      expect(notifySuccess).toHaveBeenCalledWith('Salida fichada. Has trabajado 50 min.')
    })
  })

  describe('errores y casos límite', () => {
    it('si falla el guardado avisa del error y vuelve a activar el botón', async () => {
      setShift()
      mocks.clockIn.mockRejectedValue(new Error('sin conexión'))
      const wrapper = mountView(DashboardView)

      await press(wrapper, 'Fichar entrada')

      expect(notifyError).toHaveBeenCalledWith('No hemos podido guardar el fichaje. Inténtalo de nuevo.')
      expect(notifySuccess).not.toHaveBeenCalled()
      expect(button(wrapper, 'Fichar entrada').attributes('disabled')).toBeUndefined()
    })

    it('mientras carga la jornada no deja fichar', () => {
      setShift({ isLoading: true })
      const wrapper = mountView(DashboardView)

      expect(wrapper.text()).toContain('Cargando tu jornada')
      expect(button(wrapper, 'Fichar entrada').attributes('disabled')).toBeDefined()
    })

    it('si no hay conexión con el servidor lo avisa y no deja fichar', () => {
      setShift({ hasError: true })
      const wrapper = mountView(DashboardView)

      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(button(wrapper, 'Fichar entrada').attributes('disabled')).toBeDefined()
    })

    it('al salir de la pantalla detiene el reloj', () => {
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

      await press(wrapper, 'Cerrar sesión')

      expect(mocks.logout).toHaveBeenCalledOnce()
      expect(mocks.push).toHaveBeenCalledWith({ name: 'login' })
    })
  })
})
