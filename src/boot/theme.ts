import { boot } from 'quasar/wrappers'
import { Dark } from 'quasar'

const STORAGE_KEY = 'hexxen-theme'

export default boot(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark') Dark.set(true)
  else if (saved === 'light') Dark.set(false)
  // else: 'auto' bleibt (Standard aus quasar.config.js)
})
