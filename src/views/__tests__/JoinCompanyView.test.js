import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { ref, shallowRef } from 'vue'
import JoinCompanyView from '@/views/JoinCompanyView.vue'
import { notifyError, notifySuccess } from '@/utils/notify'
import { mountView, submitForm } from './helpers'

// Estado y funciones falsas que sustituyen a Firebase y al router (ver LoginView.test.js)
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getCompany: vi.fn(),
  joinCompany: vi.fn(),
  currentCompany: null,
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { companyId: 'empresa-1' } }),
  useRouter: () => ({ push: mocks.push }),
}))
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ user: { value: { uid: 'uid-luis', email: 'luis@fixeck.test', displayName: 'Luis Pérez' } } }),
}))
vi.mock('@/composables/useCompany', () => ({
  getCompany: mocks.getCompany,
  useCompany: () => ({
    company: shallowRef(mocks.currentCompany),
    isLoading: ref(false),
    hasError: ref(false),
    joinCompany: mocks.joinCompany,
  }),
}))
vi.mock('@/utils/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

const BAKERY = { id: 'empresa-1', name: 'Panadería El Gallo', ownerId: 'uid-jefa' }

// Monta la pantalla y espera a que termine de comprobar el enlace
async function mountJoin() {
  const wrapper = mountView(JoinCompanyView)
  await flushPromises()
  return wrapper
}

describe('JoinCompanyView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.currentCompany = null
    mocks.getCompany.mockResolvedValue(BAKERY)
  })

  it('enseña la empresa que invita y avisa de que el responsable verá los fichajes', async () => {
    const wrapper = await mountJoin()

    expect(mocks.getCompany).toHaveBeenCalledWith('empresa-1')
    expect(wrapper.text()).toContain('Panadería El Gallo')
    expect(wrapper.text()).toContain('tu responsable podrá ver tus fichajes')
  })

  it('propone el nombre de la cuenta y, al aceptar, une al usuario y le lleva al panel', async () => {
    mocks.joinCompany.mockResolvedValue()
    const wrapper = await mountJoin()

    expect(wrapper.find('#memberName').element.value).toBe('Luis Pérez')
    await submitForm(wrapper)

    expect(mocks.joinCompany).toHaveBeenCalledWith('empresa-1', 'Luis Pérez')
    expect(notifySuccess).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledWith({ name: 'panel' })
  })

  it('si no se puede unir, avisa y se queda en la pantalla', async () => {
    mocks.joinCompany.mockRejectedValue(new Error())
    const wrapper = await mountJoin()

    await submitForm(wrapper)

    expect(notifyError).toHaveBeenCalledOnce()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('avisa si el enlace no corresponde a ninguna empresa', async () => {
    mocks.getCompany.mockResolvedValue(null)
    const wrapper = await mountJoin()

    expect(wrapper.text()).toContain('no es válido')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('trata como enlace no válido uno que no se puede leer', async () => {
    mocks.getCompany.mockRejectedValue(new Error())
    const wrapper = await mountJoin()

    expect(wrapper.text()).toContain('no es válido')
  })

  it('no deja unirse a quien ya pertenece a una empresa', async () => {
    mocks.currentCompany = { id: 'empresa-2', name: 'Taller Sol', ownerId: 'uid-otra' }
    const wrapper = await mountJoin()

    expect(wrapper.text()).toContain('Ya formas parte del equipo de Taller Sol')
    expect(wrapper.find('form').exists()).toBe(false)
  })
})
