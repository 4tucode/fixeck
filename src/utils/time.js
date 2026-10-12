// Funciones para mostrar horas y duraciones. No dependen de Vue ni de Firebase,
// así que se pueden probar y reutilizar en cualquier vista (panel, historial...).

// Añade un cero delante a los números de una cifra: 7 -> "07"
function pad(number) {
  return String(number).padStart(2, '0')
}

// Convierte segundos en formato de cronómetro: 3725 -> "01:02:05"
export function formatClock(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

// Convierte segundos en una duración para leer en una frase: 27120 -> "7 h 32 min"
export function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours === 0 && minutes === 0) return 'menos de un minuto'
  if (hours === 0) return `${minutes} min`
  return `${hours} h ${minutes} min`
}

// Devuelve la hora de una fecha en formato de 24 horas: "09:05"
export function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Segundos completos transcurridos entre dos fechas; nunca devuelve un número negativo
export function secondsBetween(start, end) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
}

// true si las dos fechas caen en el mismo día del calendario
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Fecha escrita con el nombre del día: "lunes, 5 de octubre"
export function formatLongDate(date) {
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Nombre de un día para los títulos del historial: "Hoy", "Ayer" o "lunes, 5 de octubre".
// Recibe también la fecha actual para poder decidir qué es hoy y qué es ayer
export function formatDay(date, today) {
  if (isSameDay(date, today)) return 'Hoy'

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(date, yesterday)) return 'Ayer'

  return formatLongDate(date)
}
