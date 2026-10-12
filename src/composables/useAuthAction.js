import { ref } from 'vue'
import { getAuthErrorMessage } from '@/utils/authErrors'
import { notifyError } from '@/utils/notify'

// Lógica común a todos los formularios de acceso (entrar, registrarse, recuperar contraseña):
// controla el estado de carga y muestra el aviso de error si la acción falla
export function useAuthAction() {
  // true mientras se espera la respuesta de Firebase; sirve para desactivar los botones
  const isLoading = ref(false)

  // Ejecuta la función recibida y devuelve true si terminó bien o false si falló
  async function run(action) {
    isLoading.value = true
    try {
      await action()
      return true
    } catch (error) {
      const message = getAuthErrorMessage(error)
      if (message) notifyError(message)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, run }
}
