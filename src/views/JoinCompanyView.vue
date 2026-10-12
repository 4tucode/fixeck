<script setup>
import { ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AuthField from '@/components/AuthField.vue'
import AuthSubmitButton from '@/components/AuthSubmitButton.vue'
import { useAuth } from '@/composables/useAuth'
import { getCompany, useCompany } from '@/composables/useCompany'
import { notifyError, notifySuccess } from '@/utils/notify'

// Pantalla a la que lleva el enlace de invitación (/unirse/<id de la empresa>).
// Enseña a qué empresa se va a unir el usuario y le pide confirmarlo con su nombre.
const route = useRoute()
const router = useRouter()
const { user } = useAuth()

// Empresa a la que ya pertenece el usuario, si tiene alguna: no puede estar en dos
const { company: currentCompany, isLoading, hasError, joinCompany } = useCompany(user.value.uid)

// Empresa de la invitación ({ id, name, ownerId }); null si el enlace no es válido
const invitingCompany = shallowRef(null)

// true hasta saber si el enlace es válido
const isCheckingLink = ref(true)

// Busca la empresa del enlace. Si no existe o no se puede leer, se trata como enlace no válido
async function loadInvitingCompany() {
  invitingCompany.value = await getCompany(route.params.companyId).catch(() => null)
  isCheckingLink.value = false
}

loadInvitingCompany()

// Nombre con el que aparecerá en el equipo; se propone el de su cuenta de Google, si entró con ella
const memberName = ref(user.value.displayName ?? '')

// true mientras se guarda, para no enviar dos veces con un doble clic
const isSaving = ref(false)

// Une al usuario al equipo y le lleva al panel para que pueda fichar
async function handleJoin() {
  isSaving.value = true
  try {
    await joinCompany(invitingCompany.value.id, memberName.value)
    notifySuccess(`Ya formas parte de ${invitingCompany.value.name}. ¡Te damos la bienvenida!`)
    router.push({ name: 'panel' })
  } catch {
    notifyError('No hemos podido unirte al equipo. Inténtalo de nuevo.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main class="mx-auto min-h-screen max-w-md px-5 pt-5 pb-16">
    <AppHeader />

    <h1 class="mt-8 font-display text-3xl font-semibold">Invitación</h1>

    <p v-if="isLoading || isCheckingLink" class="mt-8 text-noche/70 dark:text-white/70">Comprobando la invitación…</p>

    <p v-else-if="hasError" role="alert" class="mt-8 font-bold text-red-700 dark:text-red-300">
      No podemos comprobar la invitación. Revisa tu conexión y recarga la página.
    </p>

    <!-- Ya pertenece a una empresa (esta u otra): no hay nada que aceptar -->
    <div v-else-if="currentCompany" class="mt-8 rounded-2xl bg-noche/5 p-6 dark:bg-white/5">
      <p class="font-bold">Ya formas parte del equipo de {{ currentCompany.name }}.</p>
      <p class="mt-1 text-sm text-noche/70 dark:text-white/70">Cada cuenta pertenece a una sola empresa.</p>
      <RouterLink :to="{ name: 'panel' }" class="mt-4 inline-block font-extrabold underline underline-offset-4">
        Ir al panel
      </RouterLink>
    </div>

    <div v-else-if="!invitingCompany" class="mt-8 rounded-2xl bg-noche/5 p-6 dark:bg-white/5">
      <p class="font-bold">Este enlace de invitación no es válido.</p>
      <p class="mt-1 text-sm text-noche/70 dark:text-white/70">Pide a tu responsable que te lo envíe de nuevo.</p>
      <RouterLink :to="{ name: 'panel' }" class="mt-4 inline-block font-extrabold underline underline-offset-4">
        Ir al panel
      </RouterLink>
    </div>

    <!-- Invitación válida: se explica qué supone aceptarla antes de pedir la confirmación -->
    <template v-else>
      <p class="mt-2 text-noche/70 dark:text-white/70">
        Te han invitado al equipo de <strong class="text-noche dark:text-white">{{ invitingCompany.name }}</strong>.
        Si aceptas, tu responsable podrá ver tus fichajes y tu historial, pero no modificarlos.
      </p>

      <form class="mt-8 flex flex-col gap-4" @submit.prevent="handleJoin">
        <AuthField
          id="memberName"
          v-model.trim="memberName"
          label="Tu nombre"
          autocomplete="name"
          placeholder="Ana García"
          :maxlength="60"
        />
        <AuthSubmitButton :loading="isSaving" class="mt-2">Unirme al equipo</AuthSubmitButton>
      </form>

      <RouterLink :to="{ name: 'panel' }" class="mt-6 block text-center text-sm font-bold underline underline-offset-4">
        Ahora no
      </RouterLink>
    </template>
  </main>
</template>
