<script setup>
// Símbolo de Fixeck: cabeza de gallo de perfil en rojo y oro.
// El trazo del mismo color que el relleno redondea las puntas.
// El ojo es un hueco real en la cara, así que se ve bien sobre cualquier fondo.
</script>

<template>
  <svg
    viewBox="85 25 225 345"
    role="img"
    aria-label="Fixeck"
    stroke-width="5"
    stroke-linejoin="round"
  >
    <!-- Golilla: tres plumas, de oro claro a oro oscuro -->
    <path
      class="fill-alba stroke-alba"
      d="M192,94 C150,106 126,160 126,224 C126,270 136,310 102,352 C150,346 172,312 172,270 C172,230 152,190 160,150 C164,128 174,108 192,94 Z"
    />
    <path
      class="fill-alba-mid stroke-alba-mid"
      d="M194,116 C176,140 172,180 178,224 C184,266 196,304 164,342 C204,326 218,296 214,262 C210,226 190,190 188,158 C187,142 189,128 194,116 Z"
    />
    <path
      class="fill-alba-dark stroke-alba-dark"
      d="M204,142 C198,166 206,194 222,222 C236,246 244,282 226,320 C254,296 264,264 254,236 C244,210 222,190 212,168 C208,160 205,151 204,142 Z"
    />

    <!-- Cresta -->
    <path
      class="fill-cresta stroke-cresta"
      d="M176,80 C168,68 167,55 171,43 C177,56 187,64 200,65 C201,55 199,46 196,38 C208,46 216,58 219,72 C221,65 223,58 225,51 C238,62 247,76 252,92 C230,84 202,86 176,80 Z"
    />

    <!-- Cara y barba; el segundo trazado (el círculo) recorta el ojo -->
    <path
      class="fill-cresta stroke-cresta"
      fill-rule="evenodd"
      d="M224,96 C236,96 244,104 244,116 C244,126 248,134 256,142 C272,156 292,170 290,190 C288,206 276,214 264,211 C250,207 240,196 232,180 C220,158 210,140 210,122 C210,106 214,96 224,96 Z M218.5,116 a7.5,7.5 0 1,0 15,0 a7.5,7.5 0 1,0 -15,0 Z"
    />

    <!-- Pico -->
    <path
      class="fill-alba stroke-alba"
      d="M252,100 C264,102 274,110 279,124 C272,121 266,121 260,125 C262,117 259,108 252,100 Z"
    />
  </svg>
</template>
