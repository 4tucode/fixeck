<script setup>
import FixeckLogo from '@/components/FixeckLogo.vue'

// Página pública de marca (/marca): enseña el logo, sus dos versiones de uso
// y el texto que justifica las decisiones de diseño. No necesita sesión iniciada.

// Las dos versiones aprobadas del logo. Cada tarjeta fija su propio fondo y color de texto,
// así se ven las dos a la vez aunque la página esté en modo claro o en modo oscuro
const versions = [
  { title: 'Sobre fondo oscuro', use: 'Modo oscuro de la app', tileClass: 'bg-panel text-white' },
  { title: 'Sobre fondo claro', use: 'Modo claro de la app', tileClass: 'bg-crema text-noche' },
]

// Paleta de la marca; cada color lleva sus muestras y el motivo por el que se eligió
const palette = [
  {
    name: 'Rojo Cresta',
    swatches: ['#F0312F'],
    reason:
      'cresta, cara y barba. Es el color propio del gallo: aporta energía, calidez y sensación de actividad, la señal de que la jornada está en marcha.',
  },
  {
    name: 'Oro Alba',
    swatches: ['#FBBF24', '#F59E0B', '#E8890C'],
    reason:
      'las tres plumas y el pico, en tres tonos que van de claro a oscuro. Evoca la luz del amanecer, el momento en que canta el gallo y empieza el día de trabajo.',
  },
  {
    name: 'Azul Noche',
    swatches: ['#111222'],
    reason:
      'el fondo y la base institucional. Representa la confianza y la estabilidad de una plataforma legal de recursos humanos, y es el cielo justo antes de amanecer.',
  },
  {
    name: 'Blanco y Crema',
    swatches: ['#FFFFFF', '#FFF8EC'],
    reason:
      'el blanco se reserva al nombre en modo oscuro; el crema es el fondo del modo claro, donde el nombre pasa a Azul Noche.',
  },
]
</script>

<template>
  <main class="mx-auto max-w-3xl px-5 pt-20 pb-24">
    <!-- Logo principal: sigue el tema actual de la página -->
    <section class="flex flex-col items-center">
      <FixeckLogo class="logo-flotante h-[min(48vh,380px)] w-auto" />
      <p class="mt-3 font-display text-7xl leading-none font-semibold tracking-tight">fixeck</p>
    </section>

    <!-- Versiones de uso -->
    <section class="mt-16 grid gap-6 sm:grid-cols-2" aria-label="Versiones de uso del logo">
      <article
        v-for="version in versions"
        :key="version.title"
        class="flex flex-col items-center rounded-4xl px-5 pt-8 pb-6 text-center ring-1 ring-noche/10 dark:ring-white/10"
        :class="version.tileClass"
      >
        <FixeckLogo class="h-40 w-auto" />
        <p class="mt-2 font-display text-4xl leading-none font-semibold tracking-tight">fixeck</p>
        <h2 class="mt-5 text-xs font-extrabold tracking-widest uppercase">{{ version.title }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ version.use }}</p>
      </article>
    </section>

    <!-- Justificación del logotipo -->
    <section class="manual mt-20">
      <h1>Manual de Identidad Visual: Justificación del Logotipo de Fixeck</h1>

      <h2>1. El Origen y el Nombre (Naming)</h2>
      <p>
        El nombre <strong>Fixeck</strong> es la unión de dos palabras que describen, en orden, lo que hace la
        aplicación:
      </p>
      <ul>
        <li>
          <strong>Fix-, de «fixar»:</strong> en valenciano, fijar, dejar algo establecido y con constancia. Es lo que
          ocurre al fichar: la hora de entrada y la de salida quedan fijadas y ya no se pueden alterar. Conserva
          además la raíz valenciana de la marca.
        </li>
        <li>
          <strong>-eck, de «check»:</strong> el gesto universal de marcar algo como hecho, y la palabra con la que
          medio mundo nombra el fichaje (<em>check-in</em>, <em>check-out</em>). Aporta el lado tecnológico e
          internacional.
        </li>
      </ul>
      <p>
        Las dos palabras se funden en una sola: la «x» de «fixar» ocupa el lugar de la «ch» de «check» y queda en el
        centro del nombre, como bisagra entre ambas. El resultado es un nombre corto, de dos sílabas, que suena a
        gesto rápido: fijar y comprobar en un solo toque. Convierte una obligación legal en una acción cotidiana y
        ligera.
      </p>

      <h2>2. La Mascota y el Concepto: El Gallo</h2>
      <p>
        Para dotar de alma a la aplicación se ha elegido como mascota al gallo, el reloj más antiguo que existe. Su
        elección responde a una analogía directa con el control del tiempo y la jornada laboral:
      </p>
      <ul>
        <li>
          <strong>El primero en fichar:</strong> el gallo canta al alba, todos los días y a su hora. Marca el inicio de
          la jornada sin que nadie se lo recuerde, igual que Fixeck registra la entrada de forma puntual y automática.
        </li>
        <li>
          <strong>El aviso amable:</strong> su canto no vigila, avisa. Representa una herramienta que acompaña al
          equipo y le recuerda el momento, en lugar de controlarlo.
        </li>
        <li>
          <strong>Raíz cercana:</strong> es una imagen de casa, de pueblo y de huerta, que encaja con la raíz
          valenciana del nombre y aleja la marca de la frialdad habitual del software de recursos humanos.
        </li>
      </ul>

      <h2>3. Justificación de la Forma: Perfil y Espacio en Negativo</h2>
      <p>
        El logotipo utiliza únicamente la cabeza del animal, de perfil y construida con piezas planas separadas por
        espacio en negativo. Esta decisión responde a cuatro pilares:
      </p>
      <ul>
        <li>
          <strong>Silueta inconfundible:</strong> de perfil se leen de un vistazo la cresta, el pico y la barba, los
          tres rasgos que hacen que un gallo sea un gallo. Por eso se reconoce incluso a tamaño de icono.
        </li>
        <li>
          <strong>Tres plumas, tres momentos:</strong> las tres plumas que caen por el cuello representan los tres
          registros de una jornada: entrada, pausa y salida. Cada una tiene su propio tono de oro, y su trazo continuo
          transmite el paso fluido del tiempo.
        </li>
        <li>
          <strong>Mirada hacia delante:</strong> el gallo mira a la derecha, el sentido de la lectura y del avance. La
          cresta de tres puntas corona el símbolo como una señal de alerta y energía.
        </li>
        <li>
          <strong>Curvas y puntas redondeadas:</strong> no hay un solo ángulo vivo. Las formas suaves hacen la marca
          amable y cercana, y el ojo, un simple punto en negativo, le da vida sin restarle sencillez.
        </li>
      </ul>

      <h2>4. Código Cromático (Paleta de Colores)</h2>
      <p>
        El símbolo combina rojo y oro, los colores de la Senyera, de modo que la raíz valenciana del nombre también se
        ve.
      </p>
      <ul>
        <li v-for="color in palette" :key="color.name">
          <span
            v-for="hex in color.swatches"
            :key="hex"
            class="mr-1.5 inline-block size-3.5 rounded-full align-middle ring-1 ring-noche/25 dark:ring-white/25"
            :style="{ backgroundColor: hex }"
          ></span>
          <strong>{{ color.name }} ({{ color.swatches.join(', ') }}):</strong> {{ color.reason }}
        </li>
      </ul>

      <h2>5. Tipografía</h2>
      <p>
        El nombre se escribe en <strong>Fredoka Semibold</strong>, siempre en minúsculas. Sus terminaciones redondeadas
        repiten las curvas de las plumas, y la caja baja refuerza el carácter cercano de la marca. Para los textos
        se utiliza <strong>Nunito</strong>, de la misma familia de formas redondas.
      </p>
    </section>
  </main>
</template>

<style scoped>
/* El logo principal flota suavemente; se respeta a quien prefiere no ver animaciones */
@media (prefers-reduced-motion: no-preference) {
  .logo-flotante {
    animation: flotar 3.5s ease-in-out infinite;
  }
}

@keyframes flotar {
  0%,
  100% {
    transform: translateY(-5px);
  }
  50% {
    transform: translateY(5px);
  }
}

/* Estilos del texto del manual: se definen aquí una sola vez en lugar de
   repetir las mismas clases en cada título, párrafo y lista */
.manual {
  line-height: 1.65;
}

.manual h1,
.manual h2 {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.2;
}

.manual h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.manual h2 {
  font-size: 1.3rem;
  margin: 2.5rem 0 0.5rem;
}

.manual p {
  margin-bottom: 0.75rem;
  opacity: 0.85;
}

.manual ul {
  list-style: disc;
  padding-left: 1.2em;
}

.manual li {
  margin-bottom: 0.6rem;
}

.manual li::marker {
  color: var(--color-cresta);
}

.manual strong {
  font-weight: 800;
}
</style>
