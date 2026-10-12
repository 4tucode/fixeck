<script setup>
import { shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ShiftHistoryList from '@/components/ShiftHistoryList.vue'
import { useAuth } from '@/composables/useAuth'
import { useCompany } from '@/composables/useCompany'
import { getMember } from '@/composables/useTeam'
import { syncServerClock } from '@/utils/serverClock'

// Historial de fichajes de una persona del equipo, tal como lo ve su responsable.
// Es solo de lectura: los fichajes los hace siempre el empleado.
const route = useRoute()
const { user } = useAuth()

// uid de la persona cuyo historial se consulta; viene en la dirección de la página
const memberId = route.params.uid

// Se ajusta la hora con la del servidor para acertar con "Hoy" y "Ayer"
syncServerClock(user.value.uid)

const { company } = useCompany(user.value.uid)

// Ficha de la persona ({ id, name, email }); null hasta que se carga
const member = shallowRef(null)

// La ficha está dentro de la empresa, así que hay que esperar a saber cuál es.
// Si no se puede leer, la página sigue funcionando con un título genérico
watch(company, async (loadedCompany) => {
  if (!loadedCompany) return
  member.value = await getMember(loadedCompany.id, memberId).catch(() => null)
})
</script>

<template>
  <main class="mx-auto min-h-screen max-w-md px-5 pt-5 pb-16">
    <AppHeader />

    <RouterLink :to="{ name: 'empresa' }" class="mt-8 inline-block text-sm font-extrabold underline underline-offset-4">
      ← Volver al equipo
    </RouterLink>
    <h1 class="mt-3 font-display text-3xl font-semibold">{{ member?.name ?? 'Fichajes' }}</h1>
    <p v-if="member" class="mt-1 text-noche/70 dark:text-white/70">{{ member.email }}</p>

    <!-- Si quien mira no es el responsable de esta persona, las reglas de Firestore
         deniegan la lectura y la lista enseña su aviso de error -->
    <ShiftHistoryList :uid="memberId">
      <template #empty>
        <p class="font-bold">Todavía no ha fichado ninguna jornada.</p>
        <p class="mt-1 text-sm text-noche/70 dark:text-white/70">Cuando fiche, aparecerá aquí.</p>
      </template>
    </ShiftHistoryList>
  </main>
</template>
