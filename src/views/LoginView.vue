<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthField from '@/components/AuthField.vue'
import AuthLayout from '@/components/AuthLayout.vue'
import AuthSubmitButton from '@/components/AuthSubmitButton.vue'
import GoogleButton from '@/components/GoogleButton.vue'
import LiveClock from '@/components/LiveClock.vue'
import { useAuth } from '@/composables/useAuth'
import { useAuthAction } from '@/composables/useAuthAction'
import { useServerNow } from '@/composables/useServerNow'
import { notifySuccess } from '@/utils/notify'

const router = useRouter()
const { login, loginWithGoogle } = useAuth()
const { isLoading, run } = useAuthAction()

const email = ref('')
const password = ref('')

// Hora actual, que cambia cada segundo: mueve el reloj de la pantalla y decide el saludo
const { now } = useServerNow()

// Saludo según la hora del día, para que la pantalla resulte más cercana
const greeting = computed(() => {
  const hour = now.value.getHours()
  if (hour >= 6 && hour < 13) return '¡Buenos días!'
  if (hour >= 13 && hour < 21) return '¡Buenas tardes!'
  return '¡Buenas noches!'
})

// Avisa de que todo ha ido bien y lleva al panel
function enterApp() {
  notifySuccess('¡Hola de nuevo! Ya puedes fichar.')
  router.push({ name: 'panel' })
}

// Entra con el correo y la contraseña del formulario
async function handleSubmit() {
  const ok = await run(() => login(email.value, password.value))
  if (ok) enterApp()
}

async function handleGoogleLogin() {
  const ok = await run(loginWithGoogle)
  if (ok) enterApp()
}
</script>

<template>
  <AuthLayout :title="greeting" subtitle="Entra para fichar tu jornada.">
    <template #hero>
      <LiveClock :now="now" />
    </template>

    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <AuthField
        id="email"
        v-model.trim="email"
        label="Correo electrónico"
        type="email"
        autocomplete="email"
        placeholder="tu@empresa.com"
      />
      <AuthField
        id="password"
        v-model="password"
        label="Contraseña"
        type="password"
        autocomplete="current-password"
        placeholder="Tu contraseña"
      />

      <RouterLink :to="{ name: 'recuperar' }" class="-mt-1 self-end text-sm font-bold underline-offset-4 hover:underline">
        ¿Olvidaste tu contraseña?
      </RouterLink>

      <AuthSubmitButton :loading="isLoading">Entrar</AuthSubmitButton>
    </form>

    <GoogleButton :disabled="isLoading" @click="handleGoogleLogin" />

    <template #footer>
      ¿Aún no tienes cuenta?
      <RouterLink :to="{ name: 'registro' }" class="font-extrabold underline underline-offset-4">Créala aquí</RouterLink>
    </template>
  </AuthLayout>
</template>
