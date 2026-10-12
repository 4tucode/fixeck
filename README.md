# Fixeck

Aplicación web de control horario: los empleados fichan la entrada, las pausas y la salida de su jornada, ven el tiempo trabajado en tiempo real y consultan su historial. El responsable de una empresa ve en directo qué está haciendo su equipo.

El nombre une **fixar** (en valenciano, fijar o dejar constancia) y **check** (el gesto de marcar algo como hecho). La mascota es un gallo, el reloj más antiguo que existe.

**Demo:** https://fichet-2d167.web.app · **Identidad de marca:** https://fichet-2d167.web.app/marca

| Acceso | Panel | Historial |
| :---: | :---: | :---: |
| ![Pantalla de inicio de sesión](docs/login.png) | ![Panel con la jornada en curso](docs/panel.png) | ![Historial de fichajes en modo oscuro](docs/historial.png) |

![Página de identidad de marca con el logo y sus dos versiones](docs/marca.png)

## Funcionalidades

- **Acceso**: registro e inicio de sesión con correo y contraseña o con Google, verificación del correo y recuperación de contraseña.
- **Panel**: estado de la jornada (trabajando, en pausa o fuera de jornada), botones para fichar entrada, pausa y salida, y un contador en tiempo real que se detiene durante las pausas.
- **Historial**: las jornadas agrupadas por día, con sus horas, el tiempo trabajado, el tiempo en pausa y el total diario.
- **Empresa y equipo**: quien crea una empresa es su responsable e invita a su equipo con un enlace, que puede renovar para que el anterior deje de servir. Ve en directo quién está trabajando, en pausa o fuera, consulta el historial de cada persona sin poder modificarlo y puede darla de baja del equipo.
- **Tiempo real**: si se ficha desde otro dispositivo, el panel y el historial se actualizan solos.
- **Hora del servidor**: las horas de los fichajes las pone Firebase, no el reloj del dispositivo, y el contador se corrige si ese reloj va mal.
- **Modo quiosco**: el responsable convierte una tableta o un ordenador en quiosco y el equipo ficha entrada, pausa y salida tecleando un código de 4 cifras, sin correo ni contraseña. El quiosco se puede desactivar a distancia.
- **Confirmaciones**: fichar la salida, renovar el enlace y dar de baja piden confirmación antes de hacerse.
- **Modo claro y oscuro**, avisos emergentes con sonido y diseño adaptado a móvil y escritorio.

## Tecnologías

| Para qué | Con qué |
| --- | --- |
| Interfaz | Vue 3 (Composition API) y Vue Router |
| Estilos | Tailwind CSS 4 |
| Usuarios | Firebase Authentication |
| Datos | Cloud Firestore |
| Alojamiento | Firebase Hosting |
| Avisos | vue-sonner |
| Tests | Vitest y Vue Test Utils |
| Empaquetado | Vite |

## Puesta en marcha

Hace falta Node.js 24 o superior.

```bash
git clone https://github.com/4tucode/fixeck.git
cd fixeck
npm install
```

Copia `.env.example` como `.env` y rellénalo con la configuración de tu proyecto de Firebase (consola de Firebase → Configuración del proyecto → Tus apps).

Para que el acceso con Google y el correo de recuperación funcionen en local, añade `localhost` a los dominios autorizados del proyecto (Authentication → Configuración → Dominios autorizados). Después:

```bash
npm run dev
```

### Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Arranca la app en local |
| `npm test` | Ejecuta los tests |
| `npm run build` | Genera la versión de producción en `dist` |
| `npm run emulador` | Arranca los emuladores locales de Auth y Firestore |

### Trabajar sin tocar los datos reales

Con los emuladores se pueden crear usuarios y fichajes de prueba sin que lleguen al proyecto real. Necesitan la [CLI de Firebase](https://firebase.google.com/docs/cli) y Java.

1. En una terminal: `npm run emulador`
2. En el `.env`, pon `VITE_USE_EMULATORS=true`
3. En otra terminal: `npm run dev`

## Estructura del proyecto

```
src/
├── components/     Piezas de interfaz reutilizables (campos, botones, cabecera, logo)
├── composables/    Lógica con estado de Vue: sesión, jornada en curso, historial, empresa, equipo, tema
├── utils/          Funciones sin estado: formato de horas, agrupar jornadas, avisos, sonidos
├── views/          Una vista por pantalla
├── router/         Rutas y protección de las pantallas privadas
└── firebase.js     Conexión con Firebase
```

Los tests están junto al código que prueban, en carpetas `__tests__`.

## Datos y seguridad

Cada jornada es un documento en `users/{uid}/shifts`:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `startedAt` | fecha | Hora de entrada. La pone el servidor. |
| `endedAt` | fecha o `null` | Hora de salida; `null` mientras la jornada sigue abierta. |

Cada pausa es un documento en `users/{uid}/breaks`:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `shiftId` | texto | Jornada a la que pertenece. |
| `startedAt` | fecha | Inicio de la pausa. Lo pone el servidor. |
| `endedAt` | fecha o `null` | Fin de la pausa; `null` mientras dura. |

El tiempo trabajado no se guarda: se calcula restando las pausas a la duración de la jornada.

Las empresas se guardan aparte:

| Documento | Campos | Descripción |
| --- | --- | --- |
| `companies/{id}` | `name`, `ownerId`, `createdAt` | Una empresa. `ownerId` es su responsable. |
| `companies/{id}/members/{uid}` | `name`, `email`, `joinedAt`, `inviteCode` | Una persona del equipo. |
| `companies/{id}/private/invite` | `code` | Código de invitación vigente. Solo lo lee el responsable. |
| `companies/{id}/pins/{código}` | `uid`, `name` | A quién pertenece cada código de quiosco. |
| `companies/{id}/kiosks/{uid}` | `ticket`, `createdAt` | Un dispositivo activado como quiosco. |
| `companies/{id}/kioskTickets/{id}` | `createdAt` | Pase de un solo uso para activar un quiosco. |
| `users/{uid}` | `companyId` | A qué empresa pertenece el usuario. |

El enlace de invitación lleva el id de la empresa y el código vigente, largo y aleatorio. Para unirse hay que presentar ese código: la app no puede leerlo, pero las reglas sí lo comprueban. Al renovarlo, los enlaces anteriores dejan de servir. Dar de baja a alguien borra su ficha y su vínculo con la empresa; sus fichajes siguen siendo suyos.

### Cómo funciona el quiosco

Un quiosco es un dispositivo compartido, así que no entra con la cuenta de nadie: usa una sesión anónima de Firebase. Para activarlo, el responsable crea desde su sesión un pase de un solo uso; el dispositivo cierra esa sesión, abre la anónima y se da de alta gastando el pase. A partir de ahí las reglas solo le dejan comprobar un código concreto, ver la jornada abierta de esa persona y fichar por ella con la hora del servidor.

El código identifica a la persona, pero no es una contraseña: solo sirve en un dispositivo que el responsable haya activado. Límite conocido de este MVP: sin un servidor propio no se pueden limitar los intentos fallidos; el quiosco bloquea el teclado tras cinco errores, pero es un freno en el dispositivo, no una garantía.

Las reglas de `firestore.rules` garantizan que:

- cada empleado solo puede escribir sus propias jornadas y pausas, y solo las leen él y el responsable de su empresa;
- todas las horas son siempre las del servidor, no se pueden inventar;
- una pausa solo se puede crear dentro de una jornada propia que siga abierta;
- una jornada o una pausa cerrada no se puede modificar, y ninguna se puede borrar;
- el responsable ve los fichajes de su equipo pero no puede crearlos ni cambiarlos;
- nadie puede crear una empresa a nombre de otro, cambiar su responsable ni ver un equipo que no dirige;
- solo se entra en un equipo con el código de invitación vigente, que solo el responsable puede leer y renovar;
- solo el responsable da de baja, nunca a sí mismo, y desde ese momento deja de ver los fichajes de esa persona;
- cada persona pertenece como mucho a una empresa;
- un dispositivo solo se convierte en quiosco con un pase del responsable, y cada pase sirve una vez;
- el quiosco puede fichar por la gente de su empresa, pero no ver su historial, ni el equipo, ni la lista de códigos;
- los códigos de quiosco los asigna solo el responsable, son de 4 cifras y no se repiten dentro de una empresa.

## Despliegue

```bash
npm run build
firebase deploy
```

## Desarrollo asistido por IA

Este proyecto se ha desarrollado con Claude Code como copiloto de programación, de forma deliberada y transparente: es la manera de trabajar que hoy se encuentra en muchos equipos. Las decisiones de producto, la revisión y la validación de cada fase son del autor.
