import { boot } from 'quasar/wrappers'
import { createPinia } from 'pinia'
import { useCharacterStore } from 'src/stores/characterStore'
import { useCompendiumStore } from 'src/stores/compendiumStore'

export default boot(async ({ app }) => {
  const pinia = createPinia()
  app.use(pinia)

  // Daten aus IndexedDB laden
  const characterStore = useCharacterStore(pinia)
  const compendiumStore = useCompendiumStore(pinia)

  await Promise.all([
    characterStore.loadFromDB(),
    compendiumStore.loadFromDB(),
  ])
})
