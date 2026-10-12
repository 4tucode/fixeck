import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import KioskView from '@/views/KioskView.vue'
import { notifyError } from '@/utils/notify'
import { mountView } from './helpers'

// Funciones falsas que sustituyen a Firebase y al router (ver LoginView.test.js)
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  companyId: 'empresa-1',
  isKioskActive: vi.fn(),
  findEmployeeByPin: vi.fn(),
  exitKiosk: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/composables/useAuth', () => ({ useAuth: () => ({ user: { value: { uid: 'uid-quiosco' } } }) }))
vi.mock('@/composables/useCompany', () => ({
  getCompany: async () => ({ id: 'empresa-1', name: 'Panadería El Gallo', ownerId: 'uid-jefa' }),
}))
vi.mock('@/composables/useKiosk', () => ({
  getKioskCompanyId: () => mocks.companyId,
  isKioskActive: mocks.isKioskActive,
  findEmployeeByPin: mocks.findEmployeeByPin,
  exitKiosk: mocks.exitKiosk,
}))
// La sesión de la persona tiene su propia lógica; aquí basta con saber a quién se abre
vi.mock('@/components/KioskSession.vue', () => ({
  default: {
    props: ['employee'],
    emits: ['done'],
    template: '<button data-test="sesion" @click="$emit(\'done\')">{{ employee.name }}</button>',
  },
}))
vi.mock('@/utils/serverClock', () => ({ syncServerClock: vi.fn(), serverNow: () => new Date() }))
vi.mock('@/utils/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))
vi.mock('@/utils/sounds', () => ({ playKeySound: vi.fn(), playPopSound: vi.fn() }))

// Quioscos montados en cada test; se desmontan al acabar para que su teclado deje de escuchar
let mounted = []

// Monta el quiosco y espera a que compruebe que sigue activo
async function mountKiosk() {
  const wrapper = mountView(KioskView)
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

// Teclea un código en el teclado en pantalla y espera a que se compruebe
async function typePin(wrapper, pin) {
  for (const digit of pin) {
    await wrapper.findAll('button').find((button) => button.text() === digit).trigger('click')
  }
  await flushPromises()
}

describe('KioskView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.companyId = 'empresa-1'
    mocks.isKioskActive.mockResolvedValue(true)
  })

  afterEach(() => {
    mounted.forEach((wrapper) => wrapper.unmount())
    mounted = []
  })

  it('enseña la empresa y pide el código', async () => {
    const wrapper = await mountKiosk()

    expect(mocks.isKioskActive).toHaveBeenCalledWith('empresa-1', 'uid-quiosco')
    expect(wrapper.text()).toContain('Panadería El Gallo')
    expect(wrapper.text()).toContain('Teclea tu código para fichar')
  })

  it('con un código válido abre la sesión de esa persona', async () => {
    mocks.findEmployeeByPin.mockResolvedValue({ uid: 'uid-luis', name: 'Luis Pérez' })
    const wrapper = await mountKiosk()

    await typePin(wrapper, '4821')

    expect(mocks.findEmployeeByPin).toHaveBeenCalledWith('empresa-1', '4821')
    expect(wrapper.find('[data-test="sesion"]').text()).toBe('Luis Pérez')
    expect(wrapper.text()).not.toContain('Teclea tu código')
  })

  it('al terminar la sesión vuelve al teclado para la siguiente persona', async () => {
    mocks.findEmployeeByPin.mockResolvedValue({ uid: 'uid-luis', name: 'Luis Pérez' })
    const wrapper = await mountKiosk()
    await typePin(wrapper, '4821')

    await wrapper.find('[data-test="sesion"]').trigger('click')

    expect(wrapper.find('[data-test="sesion"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Teclea tu código para fichar')
  })

  it('con un código que no es de nadie, avisa y sigue en el teclado', async () => {
    mocks.findEmployeeByPin.mockResolvedValue(null)
    const wrapper = await mountKiosk()

    await typePin(wrapper, '0000')

    expect(notifyError).toHaveBeenCalledWith('Ese código no es de nadie del equipo. Prueba otra vez.')
    expect(wrapper.find('[data-test="sesion"]').exists()).toBe(false)
  })

  it('tras cinco códigos incorrectos seguidos bloquea el teclado medio minuto', async () => {
    vi.useFakeTimers()
    mocks.findEmployeeByPin.mockResolvedValue(null)
    const wrapper = await mountKiosk()

    for (let attempt = 0; attempt < 5; attempt++) await typePin(wrapper, '0000')
    await typePin(wrapper, '4821')

    // El sexto código ni se comprueba: el teclado no admitía cifras
    expect(mocks.findEmployeeByPin).toHaveBeenCalledTimes(5)

    await vi.advanceTimersByTimeAsync(30000)
    await typePin(wrapper, '4821')
    expect(mocks.findEmployeeByPin).toHaveBeenCalledTimes(6)

    vi.useRealTimers()
  })

  it('si el responsable lo ha desactivado, lo dice y no deja fichar', async () => {
    mocks.isKioskActive.mockResolvedValue(false)
    const wrapper = await mountKiosk()

    expect(wrapper.text()).toContain('Este quiosco está desactivado')
    expect(wrapper.text()).not.toContain('Teclea tu código')
  })

  it('salir del modo quiosco pide confirmación y lleva al login', async () => {
    mocks.exitKiosk.mockResolvedValue()
    const wrapper = await mountKiosk()
    const press = (text) => wrapper.findAll('button').find((button) => button.text() === text).trigger('click')

    await press('Salir del modo quiosco')
    expect(mocks.exitKiosk).not.toHaveBeenCalled()

    await press('Sí, salir')
    await flushPromises()

    expect(mocks.exitKiosk).toHaveBeenCalledWith('empresa-1', 'uid-quiosco')
    expect(mocks.push).toHaveBeenCalledWith({ name: 'login' })
  })
})
