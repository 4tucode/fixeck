import { computed, onUnmounted, ref } from 'vue'
import { serverNow } from '@/utils/serverClock'
import { secondsBetween } from '@/utils/time'

// Cronómetro: devuelve los segundos transcurridos desde una fecha, actualizados cada segundo.
// Recibe una función que devuelve la fecha de inicio (o null si no hay nada que contar)
// y debe llamarse dentro del setup de un componente.
export function useElapsedSeconds(getStartDate) {
  // Hora actual según el servidor, que es quien pone la hora de inicio: así se comparan dos
  // horas del mismo reloj. Es reactiva: al cambiarla cada segundo, Vue recalcula el tiempo
  const now = ref(serverNow())

  const timer = setInterval(() => {
    now.value = serverNow()
  }, 1000)

  // Sin esto el intervalo seguiría ejecutándose después de salir de la pantalla
  onUnmounted(() => clearInterval(timer))

  // Se calcula restando fechas en lugar de sumar 1 cada segundo: así el contador
  // no se retrasa si el navegador pausa la pestaña cuando está en segundo plano
  const elapsedSeconds = computed(() => {
    const start = getStartDate()
    return start ? secondsBetween(start, now.value) : 0
  })

  return { elapsedSeconds }
}
