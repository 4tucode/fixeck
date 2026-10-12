import { describe, expect, it } from 'vitest'
import { groupShiftsByDay, shiftDuration } from '@/utils/shifts'
import { formatDay } from '@/utils/time'

// Crea una jornada de octubre de 2026. Las horas van como [hora, minuto];
// si no se indica la salida, la jornada queda abierta
function shift(id, day, start, end = null) {
  return {
    id,
    startedAt: new Date(2026, 9, day, ...start),
    endedAt: end ? new Date(2026, 9, day, ...end) : null,
  }
}

describe('shiftDuration', () => {
  it('devuelve los segundos de una jornada cerrada', () => {
    expect(shiftDuration(shift('a', 12, [9, 0], [13, 30]))).toBe(4.5 * 3600)
  })

  it('devuelve null si la jornada sigue abierta', () => {
    expect(shiftDuration(shift('a', 12, [9, 0]))).toBeNull()
  })
})

describe('groupShiftsByDay', () => {
  it('agrupa las jornadas del mismo día y suma su duración', () => {
    const days = groupShiftsByDay([
      shift('tarde', 12, [15, 0], [18, 0]),
      shift('mañana', 12, [9, 0], [13, 0]),
      shift('viernes', 9, [8, 0], [14, 0]),
    ])

    expect(days).toHaveLength(2)
    expect(days[0].shifts.map((item) => item.id)).toEqual(['tarde', 'mañana'])
    expect(days[0].totalSeconds).toBe(7 * 3600)
    expect(days[1].shifts.map((item) => item.id)).toEqual(['viernes'])
    expect(days[1].totalSeconds).toBe(6 * 3600)
  })

  it('una jornada abierta aparece en su día pero no suma al total', () => {
    const days = groupShiftsByDay([shift('abierta', 12, [15, 0]), shift('mañana', 12, [9, 0], [13, 0])])

    expect(days[0].shifts).toHaveLength(2)
    expect(days[0].totalSeconds).toBe(4 * 3600)
  })

  it('devuelve una lista vacía si no hay jornadas', () => {
    expect(groupShiftsByDay([])).toEqual([])
  })
})

describe('formatDay', () => {
  const today = new Date(2026, 9, 12, 10, 0)

  it('llama "Hoy" al día actual y "Ayer" al anterior', () => {
    expect(formatDay(new Date(2026, 9, 12, 8, 0), today)).toBe('Hoy')
    expect(formatDay(new Date(2026, 9, 11, 23, 0), today)).toBe('Ayer')
  })

  it('escribe el resto de días con su nombre y fecha', () => {
    expect(formatDay(new Date(2026, 9, 5, 9, 0), today)).toBe('lunes, 5 de octubre')
  })

  it('acierta con "Ayer" aunque hoy sea día 1', () => {
    expect(formatDay(new Date(2026, 8, 30, 9, 0), new Date(2026, 9, 1, 10, 0))).toBe('Ayer')
  })
})
