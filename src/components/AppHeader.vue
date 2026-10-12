<script setup>
import FixeckLogo from '@/components/FixeckLogo.vue'

// Cabecera de las pantallas privadas (panel e historial): la marca, que lleva al panel.
// A su derecha queda libre el hueco del botón de tema, que es fijo y vive en App.vue.
</script>

<template>
  <header class="flex h-11 items-center">
    <RouterLink :to="{ name: 'panel' }" class="flex items-center gap-2" aria-label="Fixeck: ir al panel">
      <FixeckLogo class="h-10 w-auto" />
      <span class="font-display text-2xl leading-none font-semibold tracking-tight">fixeck</span>
    </RouterLink>
  </header>
</template>
