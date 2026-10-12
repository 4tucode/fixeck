<script setup>
import { computed, ref } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import TeamMemberRow from '@/components/TeamMemberRow.vue'
import { useAuth } from '@/composables/useAuth'
import { useServerNow } from '@/composables/useServerNow'
import { useInvite, useTeam } from '@/composables/useTeam'
import { notifyError, notifySuccess } from '@/utils/notify'

// Lo que ve el responsable de una empresa: el enlace para invitar a su equipo
// y la lista de personas con lo que está haciendo cada una en este momento.
const props = defineProps({
  // Empresa del responsable: { id, name, ownerId }
  company: { type: Object, required: true },
})

const { user } = useAuth()
const { members, isLoading, hasError } = useTeam(props.company.id)

// Hora actual, que cambia cada segundo y hace avanzar el tiempo trabajado de cada fila
const { now } = useServerNow()

// Código de invitación vigente y la función que lo cambia por otro
const { inviteCode, renewInvite } = useInvite(props.company.id)

// Enlace de invitación: lleva el id de la empresa y el código vigente, que es largo y aleatorio.
// Solo puede unirse quien recibe el enlace, y solo mientras el responsable no lo renueve.
// Queda vacío hasta que se carga el código
const inviteLink = computed(() =>
  inviteCode.value ? `${window.location.origin}/unirse/${props.company.id}/${inviteCode.value}` : '',
)

// true mientras se pregunta al responsable si de verdad quiere renovar el enlace
const isConfirmingRenew = ref(false)

// Cambia el código de invitación: el enlace anterior deja de funcionar para quien aún no se haya unido.
// Quienes ya están en el equipo no se ven afectados
async function handleRenew() {
  isConfirmingRenew.value = false
  try {
    await renewInvite()
    notifySuccess('Enlace renovado. El anterior ya no sirve.')
  } catch {
    notifyError('No hemos podido renovar el enlace. Inténtalo de nuevo.')
  }
}

// Copia el enlace al portapapeles para pegarlo en un correo o en un mensaje
async function copyInviteLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    notifySuccess('Enlace copiado. Envíaselo a tu equipo.')
  } catch {
    // Algunos navegadores no dejan copiar; el enlace está a la vista para copiarlo a mano
    notifyError('No hemos podido copiar el enlace. Selecciónalo y cópialo a mano.')
  }
}
</script>

<template>
  <!-- Invitación -->
  <section class="mt-8 rounded-2xl bg-noche/5 p-5 dark:bg-white/5">
    <h2 class="font-display text-xl font-semibold">Invita a tu equipo</h2>
    <p class="mt-1 text-sm text-noche/70 dark:text-white/70">
      Quien abra este enlace podrá unirse a {{ company.name }} con su cuenta de Fixeck.
    </p>
    <div class="mt-4 flex flex-col gap-2 sm:flex-row">
      <!-- Solo lectura: se enseña para poder copiarlo a mano; al pulsarlo se selecciona entero -->
      <input
        :value="inviteLink"
        readonly
        placeholder="Preparando el enlace…"
        aria-label="Enlace de invitación"
        class="h-12 min-w-0 flex-1 rounded-xl border-2 border-noche/15 bg-white px-4 text-sm outline-none focus:border-alba-mid dark:border-white/15 dark:bg-panel"
        @focus="$event.target.select()"
      />
      <button
        type="button"
        class="h-12 cursor-pointer rounded-xl bg-alba px-5 font-extrabold text-noche transition-colors hover:bg-alba-mid disabled:cursor-wait disabled:opacity-60"
        :disabled="!inviteLink"
        @click="copyInviteLink"
      >
        Copiar enlace
      </button>
    </div>

    <!-- Renovar: para cuando el enlace ha llegado a quien no debía -->
    <p class="mt-3 text-sm text-noche/70 dark:text-white/70">
      ¿Lo ha recibido alguien que no debía?
      <button
        type="button"
        class="cursor-pointer font-extrabold text-noche underline underline-offset-4 dark:text-white"
        :disabled="!inviteLink"
        @click="isConfirmingRenew = true"
      >
        Renovar enlace
      </button>
    </p>

    <ConfirmDialog
      :open="isConfirmingRenew"
      title="¿Renovar el enlace?"
      confirm-label="Sí, renovar enlace"
      @confirm="handleRenew"
      @cancel="isConfirmingRenew = false"
    >
      El enlace actual dejará de funcionar y tendrás que enviar el nuevo a quien aún no se haya unido.
      Quienes ya están en el equipo no notarán nada.
    </ConfirmDialog>
  </section>

  <!-- Equipo -->
  <section class="mt-8">
    <div class="flex items-baseline justify-between gap-3">
      <h2 class="font-display text-xl font-semibold">Equipo</h2>
      <p v-if="!isLoading && !hasError" class="text-sm text-noche/60 dark:text-white/60">
        {{ members.length }} {{ members.length === 1 ? 'persona' : 'personas' }}
      </p>
    </div>

    <p v-if="isLoading" class="mt-3 text-noche/70 dark:text-white/70">Cargando el equipo…</p>

    <p v-else-if="hasError" role="alert" class="mt-3 font-bold text-red-700 dark:text-red-300">
      No podemos cargar el equipo. Revisa tu conexión y recarga la página.
    </p>

    <ul v-else class="mt-3 flex flex-col gap-2">
      <TeamMemberRow
        v-for="member in members"
        :key="member.id"
        :member="member"
        :is-self="member.id === user.uid"
        :now="now"
      />
    </ul>
  </section>
</template>
