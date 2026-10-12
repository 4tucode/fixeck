import { describe, expect, it } from 'vitest'
import { groupShiftsByDay, pausedSeconds, workedSeconds } from '@/utils/shifts'
import { formatDay } from '@/utils/time'

// Crea una fecha de octubre de 2026 a partir del día y de [hora, minuto]
function at(day, [hour, minute]) {
  return new Date(2026, 9, day, hour, minute)
}

// Crea una jornada; si no se indica la salida, queda abierta
function shift(id, day, start, end = null) {
  return { id, startedAt: at(day, start), endedAt: end ? at(day, end) : null }
}

// Crea una pausa de la jornada indicada; si no se indica el final, sigue en curso
function pause(shiftId, day, start, end = null) {
  return { id: `pausa-${shiftId}-${start}`, shiftId, startedAt: at(day, start), endedAt: end ? at(day, end) : null }
}

// "Ahora" en los tests: 12 de octubre de 2026 a las 16:00
const NOW = at(12, [16, 0])

describe('pausedSeconds', () => {
  it('suma todas las pausas de la jornada', () => {
    const morning = shift('mañana', 12, [9, 0], [15, 0])
    const breaks = [pause('mañana', 12, [11, 0], [11, 15]), pause('mañana', 12, [13, 0], [13, 30])]

    expect(pausedSeconds(morning, breaks, NOW)).toBe(45 * 60)
  })

  it('ignora las pausas de otras jornadas', () => {
    const morning = shift('mañana', 12, [9, 0], [13, 0])
    const breaks = [pause('otra', 12, [10, 0], [10, 30])]

    expect(pausedSeconds(morning, breaks, NOW)).toBe(0)
  })

  it('una pausa en curso cuenta hasta ahora', () => {
    const open = shift('abierta', 12, [9, 0])
    const breaks = [pause('abierta', 12, [15, 40])]

    expect(pausedSeconds(open, breaks, NOW)).toBe(20 * 60)
  })

  it('una pausa que quedó sin cerrar termina con su jornada', () => {
    const closed = shift('cerrada', 12, [9, 0], [14, 0])
    const breaks = [pause('cerrada', 12, [13, 30])]

    expect(pausedSeconds(closed, breaks, NOW)).toBe(30 * 60)
  })
})

describe('workedSeconds', () => {
  it('resta las pausas a la duración de la jornada', () => {
    const morning = shift('mañana', 12, [9, 0], [15, 0])
    const breaks = [pause('mañana', 12, [11, 0], [11, 30])]

    expect(workedSeconds(morning, breaks, NOW)).toBe(5.5 * 3600)
  })

  it('en una jornada abierta cuenta hasta ahora', () => {
    expect(workedSeconds(shift('abierta', 12, [9, 0]), [], NOW)).toBe(7 * 3600)
  })

  it('durante una pausa el tiempo trabajado no avanza', () => {
    const open = shift('abierta', 12, [9, 0])
    const breaks = [pause('abierta', 12, [15, 0])]
    const oneMinuteLater = at(12, [16, 1])

    expect(workedSeconds(open, breaks, NOW)).toBe(6 * 3600)
    expect(workedSeconds(open, breaks, oneMinuteLater)).toBe(6 * 3600)
  })

  it('durante una pausa no baila un segundo arriba o abajo según el instante', () => {
    // Entrada a las 09:00:00.000 y pausa desde las 09:00:04.600: se trabajaron 4,6 segundos
    const open = { id: 'abierta', startedAt: new Date(2026, 9, 12, 9, 0, 0, 0), endedAt: null }
    const breaks = [{ id: 'p', shiftId: 'abierta', startedAt: new Date(2026, 9, 12, 9, 0, 4, 600), endedAt: null }]

    // Se mira en dos instantes con distinta fracción de segundo
    expect(workedSeconds(open, breaks, new Date(2026, 9, 12, 9, 0, 10, 100))).toBe(4)
    expect(workedSeconds(open, breaks, new Date(2026, 9, 12, 9, 0, 10, 900))).toBe(4)
  })
})

describe('groupShiftsByDay', () => {
  it('agrupa las jornadas del mismo día y suma lo trabajado', () => {
    const days = groupShiftsByDay(
      [shift('tarde', 12, [15, 0], [18, 0]), shift('mañana', 12, [9, 0], [13, 0]), shift('viernes', 9, [8, 0], [14, 0])],
      [],
      NOW,
    )

    expect(days).toHaveLength(2)
    expect(days[0].shifts.map((item) => item.id)).toEqual(['tarde', 'mañana'])
    expect(days[0].totalSeconds).toBe(7 * 3600)
    expect(days[1].shifts.map((item) => item.id)).toEqual(['viernes'])
    expect(days[1].totalSeconds).toBe(6 * 3600)
  })

  it('descuenta las pausas del total y las anota en cada jornada', () => {
    const days = groupShiftsByDay(
      [shift('mañana', 12, [9, 0], [14, 0])],
      [pause('mañana', 12, [11, 0], [11, 30])],
      NOW,
    )

    expect(days[0].shifts[0].pausedSeconds).toBe(30 * 60)
    expect(days[0].shifts[0].workedSeconds).toBe(4.5 * 3600)
    expect(days[0].totalSeconds).toBe(4.5 * 3600)
  })

  it('una jornada abierta aparece en su día pero no suma al total', () => {
    const days = groupShiftsByDay([shift('abierta', 12, [15, 0]), shift('mañana', 12, [9, 0], [13, 0])], [], NOW)

    expect(days[0].shifts).toHaveLength(2)
    expect(days[0].totalSeconds).toBe(4 * 3600)
  })

  it('devuelve una lista vacía si no hay jornadas', () => {
    expect(groupShiftsByDay([], [], NOW)).toEqual([])
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
