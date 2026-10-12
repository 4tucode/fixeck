<script setup>
import AppHeader from '@/components/AppHeader.vue'
import ShiftHistoryList from '@/components/ShiftHistoryList.vue'
import VerifyEmailBanner from '@/components/VerifyEmailBanner.vue'
import { useAuth } from '@/composables/useAuth'
import { syncServerClock } from '@/utils/serverClock'

const { user } = useAuth()

// Se ajusta la hora con la del servidor para acertar con "Hoy" y "Ayer"
// aunque el reloj del dispositivo esté mal puesto
syncServerClock(user.value.uid)
</script>

<template>
  <main class="mx-auto min-h-screen max-w-md px-5 pt-5 pb-16">
    <AppHeader />
    <VerifyEmailBanner />

    <RouterLink :to="{ name: 'panel' }" class="mt-8 inline-block text-sm font-extrabold underline underline-offset-4">
      ← Volver al panel
    </RouterLink>
    <h1 class="mt-3 font-display text-3xl font-semibold">Historial de fichajes</h1>

    <!-- La lista de jornadas del propio usuario -->
    <ShiftHistoryList :uid="user.uid">
      <template #empty>
        <p class="font-bold">Aún no has fichado ninguna jornada.</p>
        <p class="mt-1 text-sm text-noche/70 dark:text-white/70">Cuando fiches desde el panel, aparecerá aquí.</p>
      </template>
    </ShiftHistoryList>
  </main>
</template>
