// Funciones para trabajar con jornadas y pausas.
//   - Jornada: { id, startedAt, endedAt }           (endedAt a null si sigue abierta)
//   - Pausa:   { id, shiftId, startedAt, endedAt }  (shiftId es la jornada a la que pertenece)
// No dependen de Vue ni de Firebase, así que se pueden probar por separado.

// Milisegundos entre dos fechas; nunca devuelve un número negativo
function msBetween(start, end) {
  return Math.max(0, end.getTime() - start.getTime())
}

// Milisegundos que la jornada ha pasado en pausa, sumando todas sus pausas.
// "now" es la hora actual y se usa como final de lo que todavía sigue abierto
function pausedMs(shift, breaks, now) {
  const shiftEnd = shift.endedAt ?? now

  return breaks
    .filter((pause) => pause.shiftId === shift.id)
    .reduce((total, pause) => {
      // Una pausa sin cerrar dura hasta ahora; y ninguna puede acabar después que su jornada
      const pauseEnd = pause.endedAt ?? shiftEnd
      const end = pauseEnd > shiftEnd ? shiftEnd : pauseEnd
      return total + msBetween(pause.startedAt, end)
    }, 0)
}

// Segundos que la jornada ha pasado en pausa
export function pausedSeconds(shift, breaks, now) {
  return Math.floor(pausedMs(shift, breaks, now) / 1000)
}

// Segundos trabajados de verdad en una jornada: su duración menos las pausas.
// La resta se hace en milisegundos y se redondea una sola vez al final; redondeando cada
// parte por separado, el resultado podría bailar un segundo arriba o abajo durante una pausa
export function workedSeconds(shift, breaks, now) {
  const totalMs = msBetween(shift.startedAt, shift.endedAt ?? now)
  return Math.floor(Math.max(0, totalMs - pausedMs(shift, breaks, now)) / 1000)
}

// Identificador del día de una fecha, por ejemplo "2026-10-12". Sirve para saber
// si dos jornadas son del mismo día sin que influyan la hora ni los minutos
function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

// Agrupa las jornadas por el día en que empezaron y suma lo trabajado cada día.
// Conserva el orden de la lista recibida. Devuelve:
//   [{ key, date, shifts, totalSeconds }]
// y a cada jornada le añade workedSeconds (trabajado) y pausedSeconds (en pausa).
// Las jornadas abiertas no suman al total del día porque todavía no han terminado.
export function groupShiftsByDay(shifts, breaks, now) {
  const days = []

  for (const shift of shifts) {
    const key = dayKey(shift.startedAt)

    // Como la lista viene ordenada, una jornada solo puede pertenecer al último día creado
    let day = days.at(-1)
    if (day?.key !== key) {
      day = { key, date: shift.startedAt, shifts: [], totalSeconds: 0 }
      days.push(day)
    }

    const worked = workedSeconds(shift, breaks, now)
    day.shifts.push({ ...shift, workedSeconds: worked, pausedSeconds: pausedSeconds(shift, breaks, now) })
    if (shift.endedAt) day.totalSeconds += worked
  }

  return days
}
