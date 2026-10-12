import { toast } from 'vue-sonner'
import { playErrorSound, playSuccessSound } from '@/utils/sounds'

// Avisos emergentes (toasts) de la app. Cada uno suena al aparecer.
// Se usan estas funciones en vez de llamar a vue-sonner directamente para que
// el sonido y el aviso vayan siempre juntos y la librería se pueda cambiar en un solo sitio.

// Aviso verde: la acción ha salido bien
export function notifySuccess(message) {
  playSuccessSound()
  toast.success(message)
}

// Aviso rojo: la acción ha fallado
export function notifyError(message) {
  playErrorSound()
  toast.error(message)
}
