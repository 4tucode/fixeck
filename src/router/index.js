import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import { authReady, useAuth } from '@/composables/useAuth'

const routes = [
  // La raíz lleva al panel; si no hay sesión, el guard de abajo redirige al login
  { path: '/', redirect: '/panel' },

  // Pantallas de acceso: "guestOnly" significa que solo tienen sentido sin sesión iniciada
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
  {
    path: '/registro',
    name: 'registro',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/recuperar',
    name: 'recuperar',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { guestOnly: true },
  },
  // Destino del enlace del correo de recuperación; se puede abrir con o sin sesión
  {
    path: '/nueva-contrasena',
    name: 'nueva-contrasena',
    component: () => import('@/views/ResetPasswordView.vue'),
  },

  // Página pública con el logo y su justificación, para enseñarla sin tener cuenta
  { path: '/marca', name: 'marca', component: () => import('@/views/BrandView.vue') },

  // Las vistas privadas se cargan bajo demanda para aligerar la carga inicial
  {
    path: '/panel',
    name: 'panel',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/historial',
    name: 'historial',
    component: () => import('@/views/HistoryView.vue'),
    meta: { requiresAuth: true },
  },

  // Empresa del usuario: crearla, ver a qué empresa pertenece o, si es el responsable, su equipo
  {
    path: '/empresa',
    name: 'empresa',
    component: () => import('@/views/CompanyView.vue'),
    meta: { requiresAuth: true },
  },
  // Historial de una persona del equipo; solo lo puede ver el responsable (lo deciden las reglas de Firestore)
  {
    path: '/empresa/empleado/:uid',
    name: 'empleado',
    component: () => import('@/views/MemberHistoryView.vue'),
    meta: { requiresAuth: true },
  },
  // Destino del enlace de invitación que el responsable envía a su equipo: lleva el id de la empresa
  // y el código de invitación. El código es opcional en la ruta para que un enlace antiguo o
  // incompleto llegue igualmente a la pantalla, que es la que explica que ya no es válido
  {
    path: '/unirse/:companyId/:inviteCode?',
    name: 'unirse',
    component: () => import('@/views/JoinCompanyView.vue'),
    meta: { requiresAuth: true },
  },

  // Modo quiosco: la pantalla de un dispositivo compartido donde el equipo ficha con su código.
  // Solo se llega a ella después de que el responsable active el dispositivo desde "Mi empresa"
  { path: '/quiosco', name: 'quiosco', component: () => import('@/views/KioskView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Ruta privada a la que alguien intentó entrar sin sesión. Se recuerda para llevarle allí
// en cuanto entre: así quien abre un enlace de invitación no lo pierde por tener que iniciar sesión
let pendingPath = null

// Se ejecuta antes de cada cambio de página para proteger las rutas privadas
router.beforeEach(async (to) => {
  // Al recargar, Firebase tarda un instante en recuperar la sesión: hay que esperarlo
  // o se mandaría al login a alguien que sí estaba dentro
  await authReady
  const { user } = useAuth()

  // Un dispositivo en modo quiosco (sesión anónima) solo puede estar en la pantalla del quiosco,
  // y a esa pantalla no entra nadie más
  const isKioskDevice = user.value?.isAnonymous ?? false
  if (isKioskDevice) return to.name === 'quiosco' ? true : { name: 'quiosco' }
  if (to.name === 'quiosco') return { name: 'panel' }

  // Sin sesión no se puede entrar a las rutas marcadas como privadas
  if (to.meta.requiresAuth && !user.value) {
    if (to.name !== 'panel') pendingPath = to.fullPath
    return { name: 'login' }
  }

  // Tras entrar, las pantallas de acceso mandan al panel; si había un destino pendiente, se va a él
  if (to.name === 'panel' && pendingPath) {
    const path = pendingPath
    pendingPath = null
    return path
  }

  // Con la sesión ya iniciada no tiene sentido volver a ver las pantallas de acceso
  if (to.meta.guestOnly && user.value) return { name: 'panel' }
})

export default router
