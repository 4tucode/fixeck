<script setup>
import { ref } from 'vue'
import AuthField from '@/components/AuthField.vue'
import AuthLayout from '@/components/AuthLayout.vue'
import AuthSubmitButton from '@/components/AuthSubmitButton.vue'
import { useAuth } from '@/composables/useAuth'
import { useAuthAction } from '@/composables/useAuthAction'
import { notifySuccess } from '@/utils/notify'

const { sendResetEmail } = useAuth()
const { isLoading, run } = useAuthAction()

const email = ref('')

// Pide a Firebase que envíe el correo con el enlace para cambiar la contraseña
async function handleSubmit() {
  const ok = await run(() => sendResetEmail(email.value))
  // El mensaje no confirma si la cuenta existe, para no dar pistas a quien pruebe correos ajenos
  if (ok) notifySuccess('Si hay una cuenta con ese correo, te hemos enviado un enlace. Revisa tu bandeja.')
}
</script>

<template>
  <AuthLayout
    title="¿Olvidaste tu contraseña?"
    subtitle="Escribe tu correo y te enviamos un enlace para elegir una nueva."
  >
    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <AuthField
        id="email"
        v-model.trim="email"
        label="Correo electrónico"
        type="email"
        autocomplete="email"
        placeholder="tu@empresa.com"
      />

      <AuthSubmitButton :loading="isLoading" class="mt-2">Enviar enlace</AuthSubmitButton>
    </form>

    <template #footer>
      ¿Ya la recuerdas?
      <RouterLink :to="{ name: 'login' }" class="font-extrabold underline underline-offset-4">Vuelve a entrar</RouterLink>
    </template>
  </AuthLayout>
</template>
