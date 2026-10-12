import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref, shallowRef } from 'vue'
import VerifyEmailBanner from '@/components/VerifyEmailBanner.vue'
import { notifyError, notifySuccess } from '@/utils/notify'

// Estado y funciones falsas que sustituyen a Firebase.
// user e isEmailVerified se crean de nuevo en cada test (ver beforeEach)
const mocks = vi.hoisted(() => ({
  user: null,
  isEmailVerified: null,
  sendVerificationEmail: vi.fn(),
  refreshEmailVerified: vi.fn(),
}))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    user: mocks.user,
    isEmailVerified: mocks.isEmailVerified,
    sendVerificationEmail: mocks.sendVerificationEmail,
    refreshEmailVerified: mocks.refreshEmailVerified,
  }),
}))
vi.mock('@/utils/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

// Avisos montados durante un test. Se desmontan al terminar cada uno para que no sigan
// escuchando los cambios de pestaña y alteren los tests siguientes
let mounted = []

function mountBanner() {
  const wrapper = mount(VerifyEmailBanner)
  mounted.push(wrapper)
  return wrapper
}

// Pulsa el botón con ese texto y espera a que termine la acción
async function press(wrapper, text) {
  await wrapper.findAll('button').find((button) => button.text() === text).trigger('click')
  await flushPromises()
}

// Simula que el usuario vuelve a esta pestaña desde otra
function returnToTab() {
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('VerifyEmailBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.user = shallowRef({ email: 'ana@fixeck.test' })
    mocks.isEmailVerified = ref(false)
  })

  afterEach(() => {
    mounted.forEach((wrapper) => wrapper.unmount())
    mounted = []
  })

  it('se muestra con el correo del usuario mientras no esté verificado', () => {
    const wrapper = mountBanner()

    expect(wrapper.text()).toContain('Verifica tu correo')
    expect(wrapper.text()).toContain('ana@fixeck.test')
  })

  it('no se muestra si el correo ya está verificado', () => {
    mocks.isEmailVerified.value = true
    const wrapper = mountBanner()

    expect(wrapper.find('aside').exists()).toBe(false)
  })

  it('reenvía el correo y avisa', async () => {
    mocks.sendVerificationEmail.mockResolvedValue()
    const wrapper = mountBanner()

    await press(wrapper, 'Reenviar correo')

    expect(mocks.sendVerificationEmail).toHaveBeenCalledOnce()
    expect(notifySuccess).toHaveBeenCalledOnce()
  })

  it('avisa si se ha pedido el correo demasiadas veces', async () => {
    mocks.sendVerificationEmail.mockRejectedValue(Object.assign(new Error(), { code: 'auth/too-many-requests' }))
    const wrapper = mountBanner()

    await press(wrapper, 'Reenviar correo')

    expect(notifyError).toHaveBeenCalledWith('Demasiados intentos. Espera unos minutos y vuelve a probar.')
  })

  it('al comprobarlo, desaparece si el correo ya está verificado', async () => {
    // Al preguntar a Firebase, este responde que ya está verificado
    mocks.refreshEmailVerified.mockImplementation(async () => {
      mocks.isEmailVerified.value = true
    })
    const wrapper = mountBanner()

    await press(wrapper, 'Ya lo he verificado')

    expect(wrapper.find('aside').exists()).toBe(false)
    expect(notifySuccess).toHaveBeenCalledWith('¡Correo verificado! Gracias.')
  })

  it('al comprobarlo, avisa si todavía no está verificado', async () => {
    mocks.refreshEmailVerified.mockResolvedValue()
    const wrapper = mountBanner()

    await press(wrapper, 'Ya lo he verificado')

    expect(wrapper.find('aside').exists()).toBe(true)
    expect(notifyError).toHaveBeenCalledOnce()
  })

  it('lo comprueba solo al volver a la pestaña', async () => {
    mocks.refreshEmailVerified.mockResolvedValue()
    mountBanner()

    returnToTab()

    expect(mocks.refreshEmailVerified).toHaveBeenCalledOnce()
  })

  it('deja de comprobarlo al salir de la pantalla', () => {
    mocks.refreshEmailVerified.mockResolvedValue()
    const wrapper = mountBanner()
    wrapper.unmount()

    returnToTab()

    expect(mocks.refreshEmailVerified).not.toHaveBeenCalled()
  })
})
