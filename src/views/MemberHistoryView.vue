<script setup>
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ShiftHistoryList from '@/components/ShiftHistoryList.vue'
import { useAuth } from '@/composables/useAuth'
import { useCompany } from '@/composables/useCompany'
import { getMember, removeMember } from '@/composables/useTeam'
import { notifyError, notifySuccess } from '@/utils/notify'
import { syncServerClock } from '@/utils/serverClock'

// Historial de fichajes de una persona del equipo, tal como lo ve su responsable.
// Los fichajes son solo de lectura: los hace siempre el empleado.
// Desde aquí el responsable también puede darle de baja del equipo.
const route = useRoute()
const router = useRouter()
const { user } = useAuth()

// uid de la persona cuyo historial se consulta; viene en la dirección de la página
const memberId = route.params.uid

// Se ajusta la hora con la del servidor para acertar con "Hoy" y "Ayer"
syncServerClock(user.value.uid)

const { company, isManager } = useCompany(user.value.uid)

// Ficha de la persona ({ id, name, email }); null hasta que se carga
const member = shallowRef(null)

// La ficha está dentro de la empresa, así que hay que esperar a saber cuál es.
// Si no se puede leer, la página sigue funcionando con un título genérico
watch(company, async (loadedCompany) => {
  if (!loadedCompany) return
  member.value = await getMember(loadedCompany.id, memberId).catch(() => null)
})

// La baja solo se ofrece al responsable, una vez cargada la ficha, y nunca sobre sí mismo
const canRemove = computed(() => isManager.value && member.value !== null && memberId !== user.value.uid)

// true mientras se pregunta al responsable si de verdad quiere dar de baja a esta persona
const isConfirmingRemove = ref(false)

// Da de baja a la persona y vuelve a la lista del equipo, donde ya no aparecerá
async function handleRemove() {
  isConfirmingRemove.value = false
  try {
    await removeMember(company.value.id, memberId)
    notifySuccess(`${member.value.name} ya no forma parte del equipo.`)
    router.push({ name: 'empresa' })
  } catch {
    notifyError('No hemos podido dar de baja a esta persona. Inténtalo de nuevo.')
  }
}
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

    <!-- Baja del equipo: al final y separada, porque es una acción poco frecuente y delicada -->
    <section v-if="canRemove" class="mt-12 border-t-2 border-noche/10 pt-6 dark:border-white/10">
      <h2 class="font-display text-xl font-semibold">Dar de baja</h2>
      <p class="mt-1 text-sm text-noche/70 dark:text-white/70">
        {{ member.name }} saldrá del equipo y dejarás de ver sus fichajes. Conservará su cuenta y su historial.
      </p>
      <button
        type="button"
        class="mt-4 h-12 cursor-pointer rounded-xl border-2 border-cresta/40 px-5 font-extrabold text-cresta transition-colors hover:border-cresta"
        @click="isConfirmingRemove = true"
      >
        Dar de baja del equipo
      </button>

      <ConfirmDialog
        :open="isConfirmingRemove"
        :title="`¿Dar de baja a ${member.name}?`"
        confirm-label="Sí, dar de baja"
        @confirm="handleRemove"
        @cancel="isConfirmingRemove = false"
      >
        Dejarás de ver sus fichajes. Para volver al equipo necesitará un enlace de invitación.
      </ConfirmDialog>
    </section>
  </main>
</template>
