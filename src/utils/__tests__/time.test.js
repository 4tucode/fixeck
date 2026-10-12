import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration, formatTime, secondsBetween } from '@/utils/time'

describe('formatClock', () => {
  it('muestra horas, minutos y segundos con dos cifras', () => {
    expect(formatClock(0)).toBe('00:00:00')
    expect(formatClock(3725)).toBe('01:02:05')
  })

  it('no reinicia las horas al pasar de 24', () => {
    expect(formatClock(25 * 3600)).toBe('25:00:00')
  })
})

describe('formatDuration', () => {
  it('muestra horas y minutos', () => {
    expect(formatDuration(27120)).toBe('7 h 32 min')
  })

  it('omite las horas si no llega a una', () => {
    expect(formatDuration(300)).toBe('5 min')
  })

  it('avisa si ha durado menos de un minuto', () => {
    expect(formatDuration(40)).toBe('menos de un minuto')
  })
})

describe('formatTime', () => {
  it('muestra la hora en formato de 24 horas con ceros delante', () => {
    expect(formatTime(new Date(2026, 9, 12, 9, 5))).toBe('09:05')
    expect(formatTime(new Date(2026, 9, 12, 17, 30))).toBe('17:30')
  })
})

describe('secondsBetween', () => {
  it('cuenta los segundos completos entre dos fechas', () => {
    const start = new Date(2026, 9, 12, 9, 0, 0)
    const end = new Date(2026, 9, 12, 9, 1, 30, 900)
    expect(secondsBetween(start, end)).toBe(90)
  })

  it('devuelve 0 si la fecha final es anterior a la inicial', () => {
    const start = new Date(2026, 9, 12, 9, 0, 5)
    const end = new Date(2026, 9, 12, 9, 0, 0)
    expect(secondsBetween(start, end)).toBe(0)
  })
})
