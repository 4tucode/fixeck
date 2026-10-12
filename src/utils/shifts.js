import { secondsBetween } from '@/utils/time'

// Funciones para trabajar con listas de jornadas ({ id, startedAt, endedAt }).
// No dependen de Vue ni de Firebase, así que se pueden probar por separado.

// Devuelve los segundos que duró una jornada, o null si todavía sigue abierta
export function shiftDuration(shift) {
  return shift.endedAt ? secondsBetween(shift.startedAt, shift.endedAt) : null
}

// Identificador del día de una fecha, por ejemplo "2026-10-12". Sirve para saber
// si dos jornadas son del mismo día sin que influyan la hora ni los minutos
function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

// Agrupa las jornadas por el día en que empezaron y suma lo trabajado cada día.
// Conserva el orden de la lista recibida. Devuelve:
//   [{ key, date, shifts, totalSeconds }]
// Las jornadas abiertas no suman al total porque aún no tienen duración.
export function groupShiftsByDay(shifts) {
  const days = []

  for (const shift of shifts) {
    const key = dayKey(shift.startedAt)

    // Como la lista viene ordenada, una jornada solo puede pertenecer al último día creado
    let day = days.at(-1)
    if (day?.key !== key) {
      day = { key, date: shift.startedAt, shifts: [], totalSeconds: 0 }
      days.push(day)
    }

    day.shifts.push(shift)
    day.totalSeconds += shiftDuration(shift) ?? 0
  }

  return days
}
