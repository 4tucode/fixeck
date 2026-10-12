<script setup>
import { ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AuthField from '@/components/AuthField.vue'
import AuthSubmitButton from '@/components/AuthSubmitButton.vue'
import MyKioskPin from '@/components/MyKioskPin.vue'
import TeamList from '@/components/TeamList.vue'
import { useAuth } from '@/composables/useAuth'
import { useCompany } from '@/composables/useCompany'
import { notifyError, notifySuccess } from '@/utils/notify'
import { syncServerClock } from '@/utils/serverClock'

// Pantalla "Mi empresa". Enseña una cosa distinta según la situación del usuario:
//   - sin empresa:  el formulario para crear una (quien la crea es su responsable)
//   - responsable:  el enlace de invitación y su equipo, con el estado de cada persona
//   - empleado:     a qué empresa pertenece
const { user } = useAuth()
const uid = user.value.uid

// La lista del equipo calcula tiempos trabajados: se ajusta la hora con la del servidor
syncServerClock(uid)

const { company, isManager, isLoading, hasError, createCompany } = useCompany(uid)

// Campos del formulario de crear empresa. El nombre de la persona se propone a partir
// de su cuenta de Google, si entró con ella
const companyName = ref('')
const memberName = ref(user.value.displayName ?? '')

// true mientras se guarda, para no crear dos empresas con un doble clic
const isSaving = ref(false)

// Crea la empresa con los datos del formulario. Al terminar, "company" ya tiene valor
// y la pantalla pasa sola a enseñar el equipo
async function handleCreate() {
  isSaving.value = true
  try {
    await createCompany(companyName.value, memberName.value)
    notifySuccess('¡Empresa creada! Ya puedes invitar a tu equipo.')
  } catch {
    notifyError('No hemos podido crear la empresa. Inténtalo de nuevo.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <!-- El responsable tiene más que ver (invitación y equipo), así que su pantalla es más ancha -->
  <main class="mx-auto min-h-screen px-5 pt-5 pb-16" :class="isManager ? 'max-w-2xl' : 'max-w-md'">
    <AppHeader />

    <RouterLink :to="{ name: 'panel' }" class="mt-8 inline-block text-sm font-extrabold underline underline-offset-4">
      ← Volver al panel
    </RouterLink>
    <h1 class="mt-3 font-display text-3xl font-semibold">{{ company?.name ?? 'Mi empresa' }}</h1>

    <p v-if="isLoading" class="mt-8 text-noche/70 dark:text-white/70">Cargando tu empresa…</p>

    <p v-else-if="hasError" role="alert" class="mt-8 font-bold text-red-700 dark:text-red-300">
      No podemos cargar tu empresa. Revisa tu conexión y recarga la página.
    </p>

    <!-- Responsable -->
    <TeamList v-else-if="isManager" :company="company" />

    <!-- Empleado -->
    <template v-else-if="company">
      <div class="mt-8 rounded-2xl bg-noche/5 p-6 dark:bg-white/5">
        <p class="font-bold">Formas parte del equipo de {{ company.name }}.</p>
        <p class="mt-1 text-sm text-noche/70 dark:text-white/70">
          Tu responsable puede ver tus fichajes y tu historial, pero no modificarlos.
        </p>
      </div>
      <MyKioskPin :company-id="company.id" :uid="uid" />
    </template>

    <!-- Sin empresa -->
    <template v-else>
      <p class="mt-2 text-noche/70 dark:text-white/70">
        Crea tu empresa para ver los fichajes de tu equipo. Serás su responsable.
      </p>

      <form class="mt-8 flex flex-col gap-4" @submit.prevent="handleCreate">
        <AuthField
          id="companyName"
          v-model.trim="companyName"
          label="Nombre de la empresa"
          autocomplete="organization"
          placeholder="Panadería El Gallo"
          :maxlength="60"
        />
        <AuthField
          id="memberName"
          v-model.trim="memberName"
          label="Tu nombre"
          autocomplete="name"
          placeholder="Ana García"
          :maxlength="60"
        />
        <AuthSubmitButton :loading="isSaving" class="mt-2">Crear empresa</AuthSubmitButton>
      </form>

      <p class="mt-8 rounded-2xl bg-noche/5 p-5 text-sm text-noche/70 dark:bg-white/5 dark:text-white/70">
        <strong class="text-noche dark:text-white">¿Tu empresa ya usa Fixeck?</strong>
        Pide a tu responsable el enlace de invitación y ábrelo para unirte a su equipo.
      </p>
    </template>
  </main>
</template>
