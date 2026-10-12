import { onUnmounted, ref } from 'vue'
import { serverNow } from '@/utils/serverClock'

// Reloj reactivo: devuelve la hora actual según el servidor, actualizada cada segundo.
// Todo lo que se calcule a partir de ella (el contador del panel, por ejemplo) se
// recalcula solo. Debe llamarse dentro del setup de un componente.
//
// Se usa la hora del servidor porque también es él quien pone las horas de los fichajes:
// así se comparan siempre horas del mismo reloj, aunque el del dispositivo vaya mal.
export function useServerNow() {
  const now = ref(serverNow())

  const timer = setInterval(() => {
    now.value = serverNow()
  }, 1000)

  // Sin esto el intervalo seguiría ejecutándose después de salir de la pantalla
  onUnmounted(() => clearInterval(timer))

  return { now }
}
