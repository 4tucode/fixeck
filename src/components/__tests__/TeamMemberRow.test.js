import { describe, expect, it, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { computed, ref, shallowRef } from 'vue'
import TeamMemberRow from '@/components/TeamMemberRow.vue'

// Estado falso de la jornada de la persona; cada test lo prepara con setShift
const mocks = vi.hoisted(() => ({ shift: null, useShift: vi.fn() }))

vi.mock('@/composables/useShift', () => ({
  useShift: (uid) => {
    mocks.useShift(uid)
    return mocks.shift
  },
}))

// "Ahora" en todos los tests: 12 de octubre de 2026 a las 12:00
const NOW = new Date(2026, 9, 12, 12, 0)
const NINE = new Date(2026, 9, 12, 9, 0)

const LUIS = { id: 'uid-luis', name: 'Luis Pérez', email: 'luis@fixeck.test' }

// Prepara la jornada de la persona: hora de entrada (o null si está fuera) y sus pausas
function setShift({ startedAt = null, breaks = [], isLoading = false } = {}) {
  const breakList = breaks.map((pause, index) => ({ id: `pausa-${index}`, shiftId: 'jornada-1', ...pause }))
  mocks.shift = {
    activeShift: shallowRef(startedAt ? { id: 'jornada-1', startedAt, endedAt: null } : null),
    breaks: shallowRef(breakList),
    openBreak: computed(() => breakList.find((pause) => pause.endedAt === null) ?? null),
    isLoading: ref(isLoading),
  }
}

function mountRow(props = {}) {
  return mount(TeamMemberRow, {
    props: { member: LUIS, now: NOW, ...props },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('TeamMemberRow', () => {
  it('consulta la jornada de esa persona y enlaza con su historial', () => {
    setShift()
    const wrapper = mountRow()

    expect(mocks.useShift).toHaveBeenCalledWith('uid-luis')
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({ name: 'empleado', params: { uid: 'uid-luis' } })
  })

  it('fuera de jornada, enseña su correo', () => {
    setShift()
    const wrapper = mountRow()

    expect(wrapper.text()).toContain('Luis Pérez')
    expect(wrapper.text()).toContain('Fuera')
    expect(wrapper.text()).toContain('luis@fixeck.test')
  })

  it('trabajando, enseña la hora de entrada y lo trabajado sin contar las pausas', () => {
    setShift({
      startedAt: NINE,
      breaks: [{ startedAt: new Date(2026, 9, 12, 10, 0), endedAt: new Date(2026, 9, 12, 10, 30) }],
    })
    const wrapper = mountRow()

    expect(wrapper.text()).toContain('Trabajando')
    expect(wrapper.text()).toContain('Entrada a las 09:00')
    expect(wrapper.text()).toContain('2 h 30 min')
  })

  it('en pausa, enseña desde cuándo', () => {
    setShift({ startedAt: NINE, breaks: [{ startedAt: new Date(2026, 9, 12, 11, 45), endedAt: null }] })
    const wrapper = mountRow()

    expect(wrapper.text()).toContain('En pausa desde las 11:45')
  })

  it('marca la fila del propio responsable', () => {
    setShift()

    expect(mountRow({ isSelf: true }).text()).toContain('(tú)')
    expect(mountRow().text()).not.toContain('(tú)')
  })
})
