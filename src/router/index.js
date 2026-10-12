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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Se ejecuta antes de cada cambio de página para proteger las rutas privadas
router.beforeEach(async (to) => {
  // Al recargar, Firebase tarda un instante en recuperar la sesión: hay que esperarlo
  // o se mandaría al login a alguien que sí estaba dentro
  await authReady
  const { user } = useAuth()

  // Sin sesión no se puede entrar a las rutas marcadas como privadas
  if (to.meta.requiresAuth && !user.value) return { name: 'login' }

  // Con la sesión ya iniciada no tiene sentido volver a ver las pantallas de acceso
  if (to.meta.guestOnly && user.value) return { name: 'panel' }
})

export default router
