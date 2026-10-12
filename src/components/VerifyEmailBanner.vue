<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAuthAction } from '@/composables/useAuthAction'
import { notifyError, notifySuccess } from '@/utils/notify'

// Aviso que se muestra en las pantallas privadas mientras el usuario no haya verificado su correo.
// No bloquea nada: se puede fichar igualmente. Desaparece solo en cuanto el correo queda verificado.
const { user, isEmailVerified, sendVerificationEmail, refreshEmailVerified } = useAuth()
const { isLoading, run } = useAuthAction()

// Vuelve a enviar el correo, por si el primero se perdió o caducó
async function handleResend() {
  const ok = await run(sendVerificationEmail)
  if (ok) notifySuccess('Te hemos enviado otro correo. Revisa también la carpeta de spam.')
}

// El usuario dice que ya ha pulsado el enlace del correo: se comprueba con Firebase
async function handleCheck() {
  const ok = await run(refreshEmailVerified)
  if (!ok) return
  if (isEmailVerified.value) notifySuccess('¡Correo verificado! Gracias.')
  else notifyError('Todavía no consta como verificado. Pulsa el enlace del correo e inténtalo de nuevo.')
}

// El enlace del correo se abre en otra pestaña. Al volver a esta se comprueba
// en silencio si ya está verificado, para que el aviso desaparezca sin pulsar nada
function checkWhenTabIsVisible() {
  if (document.visibilityState === 'visible' && !isEmailVerified.value) {
    // Si falla (por ejemplo, sin conexión) no se avisa: es una comprobación de cortesía
    refreshEmailVerified().catch(() => {})
  }
}

onMounted(() => document.addEventListener('visibilitychange', checkWhenTabIsVisible))

// Sin esto el navegador seguiría llamando a la función después de salir de la pantalla
onUnmounted(() => document.removeEventListener('visibilitychange', checkWhenTabIsVisible))
</script>

<template>
  <aside v-if="user && !isEmailVerified" class="mt-5 rounded-2xl bg-alba/20 px-4 py-3 text-sm" aria-label="Verifica tu correo">
    <p>
      <strong class="font-extrabold">Verifica tu correo.</strong>
      Te hemos enviado un enlace a {{ user.email }}.
    </p>
    <p class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      <button
        type="button"
        class="cursor-pointer font-extrabold underline underline-offset-4 disabled:cursor-wait disabled:opacity-60"
        :disabled="isLoading"
        @click="handleCheck"
      >
        Ya lo he verificado
      </button>
      <button
        type="button"
        class="cursor-pointer font-bold underline underline-offset-4 disabled:cursor-wait disabled:opacity-60"
        :disabled="isLoading"
        @click="handleResend"
      >
        Reenviar correo
      </button>
    </p>
  </aside>
</template>
