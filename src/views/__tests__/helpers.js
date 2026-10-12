import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'

// Utilidades compartidas por los tests de las pantallas de acceso

// Monta una vista sustituyendo los enlaces del router por una versión de prueba
export function mountView(view) {
  return mount(view, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

// Envía el formulario de la vista y espera a que terminen las promesas pendientes
export async function submitForm(wrapper) {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

// Crea un error con el mismo formato que los de Firebase (un Error con la propiedad "code")
export function firebaseError(code) {
  return Object.assign(new Error(code), { code })
}
