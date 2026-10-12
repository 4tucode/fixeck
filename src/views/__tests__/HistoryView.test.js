import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, shallowRef } from 'vue'
import HistoryView from '@/views/HistoryView.vue'
import { mountView } from './helpers'

// Estado falso del historial; cada test lo prepara con setHistory (ver LoginView.test.js)
const mocks = vi.hoisted(() => ({ history: null }))

// "Ahora" en todos los tests: lunes 12 de octubre de 2026 a las 16:00
const NOW = new Date(2026, 9, 12, 16, 0)

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ user: { value: { uid: 'uid-ana', email: 'ana@fixeck.test' } } }),
}))
vi.mock('@/composables/useShiftHistory', () => ({ useShiftHistory: () => mocks.history }))
vi.mock('@/utils/serverClock', () => ({ syncServerClock: vi.fn(), serverNow: () => NOW }))

// Prepara lo que devolverá el historial: las jornadas, sus pausas y los estados
function setHistory({ shifts = [], breaks = [], isLoading = false, hasError = false } = {}) {
  mocks.history = {
    shifts: shallowRef(shifts),
    breaks: shallowRef(breaks),
    isLoading: ref(isLoading),
    hasError: ref(hasError),
  }
}

describe('HistoryView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra las jornadas agrupadas por día con sus horas y duraciones', () => {
    setHistory({
      shifts: [
        { id: 'hoy', startedAt: new Date(2026, 9, 12, 9, 0), endedAt: new Date(2026, 9, 12, 13, 30) },
        { id: 'ayer', startedAt: new Date(2026, 9, 11, 8, 0), endedAt: new Date(2026, 9, 11, 15, 0) },
      ],
    })
    const wrapper = mountView(HistoryView)
    const days = wrapper.findAll('section')

    expect(days).toHaveLength(2)
    expect(days[0].find('h2').text()).toBe('Hoy')
    expect(days[0].text()).toContain('09:00')
    expect(days[0].text()).toContain('13:30')
    expect(days[0].text()).toContain('4 h 30 min')
    expect(days[1].find('h2').text()).toBe('Ayer')
    expect(days[1].text()).toContain('7 h 0 min')
  })

  it('descuenta las pausas del tiempo trabajado y enseña cuánto duraron', () => {
    setHistory({
      shifts: [{ id: 'hoy', startedAt: new Date(2026, 9, 12, 9, 0), endedAt: new Date(2026, 9, 12, 14, 0) }],
      breaks: [
        { id: 'pausa', shiftId: 'hoy', startedAt: new Date(2026, 9, 12, 11, 0), endedAt: new Date(2026, 9, 12, 11, 30) },
      ],
    })
    const wrapper = mountView(HistoryView)
    const row = wrapper.find('li')

    expect(row.text()).toContain('30 min de pausa')
    expect(row.text()).toContain('4 h 30 min')
    expect(wrapper.find('section > div').text()).toContain('4 h 30 min')
  })

  it('no menciona las pausas en una jornada que no tuvo ninguna', () => {
    setHistory({
      shifts: [{ id: 'hoy', startedAt: new Date(2026, 9, 12, 9, 0), endedAt: new Date(2026, 9, 12, 14, 0) }],
    })
    const wrapper = mountView(HistoryView)

    expect(wrapper.find('li').text()).not.toContain('de pausa')
  })

  it('marca como "En curso" la jornada que sigue abierta', () => {
    setHistory({ shifts: [{ id: 'abierta', startedAt: new Date(2026, 9, 12, 15, 0), endedAt: null }] })
    const wrapper = mountView(HistoryView)

    expect(wrapper.find('li').text()).toContain('15:00')
    expect(wrapper.find('li').text()).toContain('En curso')
  })

  it('suma en el total del día solo las jornadas cerradas', () => {
    setHistory({
      shifts: [
        { id: 'abierta', startedAt: new Date(2026, 9, 12, 15, 0), endedAt: null },
        { id: 'mañana', startedAt: new Date(2026, 9, 12, 9, 0), endedAt: new Date(2026, 9, 12, 13, 0) },
      ],
    })
    const wrapper = mountView(HistoryView)

    expect(wrapper.find('section > div').text()).toContain('4 h 0 min')
  })

  it('avisa si todavía no hay ninguna jornada', () => {
    setHistory()
    const wrapper = mountView(HistoryView)

    expect(wrapper.text()).toContain('Aún no has fichado ninguna jornada')
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('mientras carga no enseña el aviso de historial vacío', () => {
    setHistory({ isLoading: true })
    const wrapper = mountView(HistoryView)

    expect(wrapper.text()).toContain('Cargando tus fichajes')
    expect(wrapper.text()).not.toContain('Aún no has fichado')
  })

  it('avisa si no puede cargar el historial', () => {
    setHistory({ hasError: true })
    const wrapper = mountView(HistoryView)

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
