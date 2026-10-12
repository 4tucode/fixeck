<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthField from '@/components/AuthField.vue'
import AuthLayout from '@/components/AuthLayout.vue'
import AuthSubmitButton from '@/components/AuthSubmitButton.vue'
import { useAuth } from '@/composables/useAuth'
import { useAuthAction } from '@/composables/useAuthAction'
import { notifySuccess } from '@/utils/notify'

// Pantalla a la que llega el usuario desde el enlace del correo de "olvidé mi contraseña".
// El enlace trae un código de un solo uso en la URL (?oobCode=...) que identifica la petición.
const route = useRoute()
const router = useRouter()
const { checkResetCode, saveNewPassword } = useAuth()
const { isLoading, run } = useAuthAction()

const resetCode = route.query.oobCode
const password = ref('')

// Correo de la cuenta, que Firebase devuelve al validar el código
const accountEmail = ref('')

// Fases de la pantalla: 'checking' mientras se valida el código,
// 'ready' si se puede cambiar la contraseña e 'invalid' si el enlace ya no sirve
const status = ref('checking')

// Texto de ayuda bajo el título, distinto en cada fase
const subtitle = computed(() => {
  if (status.value === 'ready') return `Elige una contraseña nueva para ${accountEmail.value}.`
  if (status.value === 'invalid') return 'Este enlace ha caducado o ya se ha usado.'
  return 'Comprobando el enlace…'
})

// Al entrar se comprueba el código antes de enseñar el formulario,
// para no hacer escribir una contraseña que luego no se podrá guardar
onMounted(async () => {
  if (!resetCode) {
    status.value = 'invalid'
    return
  }
  try {
    accountEmail.value = await checkResetCode(resetCode)
    status.value = 'ready'
  } catch {
    status.value = 'invalid'
  }
})

// Guarda la contraseña nueva y manda al login para entrar con ella
async function handleSubmit() {
  const ok = await run(() => saveNewPassword(resetCode, password.value))
  if (!ok) return
  notifySuccess('Contraseña cambiada. Ya puedes entrar con la nueva.')
  router.push({ name: 'login' })
}
</script>

<template>
  <AuthLayout title="Nueva contraseña" :subtitle="subtitle">
    <form v-if="status === 'ready'" class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <AuthField
        id="password"
        v-model="password"
        label="Contraseña nueva"
        type="password"
        autocomplete="new-password"
        placeholder="Mínimo 6 caracteres"
        :minlength="6"
      />

      <AuthSubmitButton :loading="isLoading" class="mt-2">Guardar contraseña</AuthSubmitButton>
    </form>

    <!-- Enlace caducado: se ofrece pedir uno nuevo en lugar de dejar al usuario sin salida -->
    <RouterLink
      v-else-if="status === 'invalid'"
      :to="{ name: 'recuperar' }"
      class="grid h-12 w-full place-items-center rounded-xl bg-alba text-lg font-extrabold text-noche transition-colors hover:bg-alba-mid"
    >
      Pedir un enlace nuevo
    </RouterLink>

    <template #footer>
      <RouterLink :to="{ name: 'login' }" class="font-extrabold underline underline-offset-4">Volver al inicio de sesión</RouterLink>
    </template>
  </AuthLayout>
</template>
