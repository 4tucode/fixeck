<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthField from '@/components/AuthField.vue'
import AuthLayout from '@/components/AuthLayout.vue'
import AuthSubmitButton from '@/components/AuthSubmitButton.vue'
import GoogleButton from '@/components/GoogleButton.vue'
import { useAuth } from '@/composables/useAuth'
import { useAuthAction } from '@/composables/useAuthAction'
import { notifySuccess } from '@/utils/notify'

const router = useRouter()
const { register, loginWithGoogle } = useAuth()
const { isLoading, run } = useAuthAction()

const email = ref('')
const password = ref('')

// Enseña el aviso recibido y lleva al panel
function enterApp(message) {
  notifySuccess(message)
  router.push({ name: 'panel' })
}

// Crea la cuenta con el correo y la contraseña del formulario; register envía además
// el correo de verificación. Firebase deja la sesión iniciada, así que no hace falta pasar por el login
async function handleSubmit() {
  const ok = await run(() => register(email.value, password.value))
  if (ok) enterApp('¡Cuenta creada! Te hemos enviado un correo para verificar tu dirección.')
}

// Con Google no hay registro aparte: si la cuenta no existía, se crea al entrar,
// y su correo ya viene verificado
async function handleGoogleLogin() {
  const ok = await run(loginWithGoogle)
  if (ok) enterApp('¡Te damos la bienvenida a Fixeck!')
}
</script>

<template>
  <AuthLayout title="Crea tu cuenta" subtitle="Solo necesitas un correo para empezar a fichar.">
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
        autocomplete="new-password"
        placeholder="Mínimo 6 caracteres"
        :minlength="6"
      />

      <AuthSubmitButton :loading="isLoading" class="mt-2">Crear cuenta</AuthSubmitButton>
    </form>

    <GoogleButton :disabled="isLoading" @click="handleGoogleLogin" />

    <template #footer>
      ¿Ya tienes cuenta?
      <RouterLink :to="{ name: 'login' }" class="font-extrabold underline underline-offset-4">Entra aquí</RouterLink>
    </template>
  </AuthLayout>
</template>
