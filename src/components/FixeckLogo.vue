<script setup>
// Símbolo de Fixeck: cabeza de gallo de perfil en rojo y oro.
// El trazo del mismo color que el relleno redondea las puntas.
// El ojo es un hueco real en la cara, así que se ve bien sobre cualquier fondo.
defineProps({
  // Con animated el gallo cobra vida: flota, mueve la cresta y las plumas, y parpadea.
  // Se reserva para donde el logo es protagonista (acceso y página de marca)
  animated: { type: Boolean, default: false },
})
</script>

<template>
  <svg
    viewBox="85 25 225 345"
    role="img"
    aria-label="Fixeck"
    stroke-width="5"
    stroke-linejoin="round"
    class="overflow-visible"
    :class="{ animado: animated }"
  >
    <!-- Golilla: tres plumas, de oro claro a oro oscuro -->
    <path
      class="pluma pluma-1 fill-alba stroke-alba"
      d="M192,94 C150,106 126,160 126,224 C126,270 136,310 102,352 C150,346 172,312 172,270 C172,230 152,190 160,150 C164,128 174,108 192,94 Z"
    />
    <path
      class="pluma pluma-2 fill-alba-mid stroke-alba-mid"
      d="M194,116 C176,140 172,180 178,224 C184,266 196,304 164,342 C204,326 218,296 214,262 C210,226 190,190 188,158 C187,142 189,128 194,116 Z"
    />
    <path
      class="pluma pluma-3 fill-alba-dark stroke-alba-dark"
      d="M204,142 C198,166 206,194 222,222 C236,246 244,282 226,320 C254,296 264,264 254,236 C244,210 222,190 212,168 C208,160 205,151 204,142 Z"
    />

    <!-- Cresta -->
    <path
      class="cresta fill-cresta stroke-cresta"
      d="M176,80 C168,68 167,55 171,43 C177,56 187,64 200,65 C201,55 199,46 196,38 C208,46 216,58 219,72 C221,65 223,58 225,51 C238,62 247,76 252,92 C230,84 202,86 176,80 Z"
    />

    <!-- Cara y barba; el segundo trazado (el círculo) recorta el ojo -->
    <path
      class="fill-cresta stroke-cresta"
      fill-rule="evenodd"
      d="M224,96 C236,96 244,104 244,116 C244,126 248,134 256,142 C272,156 292,170 290,190 C288,206 276,214 264,211 C250,207 240,196 232,180 C220,158 210,140 210,122 C210,106 214,96 224,96 Z M218.5,116 a7.5,7.5 0 1,0 15,0 a7.5,7.5 0 1,0 -15,0 Z"
    />

    <!-- Párpado: un círculo del color de la cara que tapa el ojo un instante para parpadear.
         Solo existe en la versión animada -->
    <circle v-if="animated" class="parpado fill-cresta" cx="226" cy="116" r="8" stroke="none" />

    <!-- Pico -->
    <path
      class="fill-alba stroke-alba"
      d="M252,100 C264,102 274,110 279,124 C272,121 266,121 260,125 C262,117 259,108 252,100 Z"
    />
  </svg>
</template>

<style scoped>
/* Animaciones de la versión animada. Cada pieza gira alrededor del punto por el que
   se une al cuerpo (transform-origin, en coordenadas del dibujo) para que el movimiento sea natural.
   Solo se activan si el usuario no ha pedido reducir el movimiento en su sistema */
@media (prefers-reduced-motion: no-preference) {
  .animado {
    animation: flotar 3.5s ease-in-out infinite;
  }

  .animado .cresta {
    transform-origin: 214px 86px;
    animation: balanceo 2.6s ease-in-out infinite;
    --giro: 2.5deg;
  }

  .animado .pluma {
    animation: balanceo 3.2s ease-in-out infinite;
    --giro: 1.5deg;
  }

  /* Cada pluma empieza en un momento distinto para que no se muevan todas a la vez */
  .animado .pluma-1 {
    transform-origin: 192px 94px;
  }

  .animado .pluma-2 {
    transform-origin: 194px 116px;
    animation-delay: -0.4s;
  }

  .animado .pluma-3 {
    transform-origin: 204px 142px;
    animation-delay: -0.8s;
  }

  .animado .parpado {
    transform-origin: 226px 116px;
    animation: parpadeo 4s infinite;
  }
}

/* Sin animación el párpado queda abierto (invisible) */
.parpado {
  transform: scaleY(0);
}

@keyframes flotar {
  0%,
  100% {
    transform: translateY(-3%);
  }
  50% {
    transform: translateY(3%);
  }
}

@keyframes balanceo {
  0%,
  100% {
    transform: rotate(calc(var(--giro) * -1));
  }
  50% {
    transform: rotate(var(--giro));
  }
}

/* El ojo está abierto casi todo el tiempo y se cierra un instante al final del ciclo */
@keyframes parpadeo {
  0%,
  94%,
  100% {
    transform: scaleY(0);
  }
  97% {
    transform: scaleY(1);
  }
}
</style>
