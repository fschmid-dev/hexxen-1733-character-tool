import { computed } from 'vue'
import { useQuasar } from 'quasar'

const STORAGE_KEY = 'hexxen-theme'

export function useTheme() {
  const $q = useQuasar()

  const themeIcon = computed(() => {
    const m = $q.dark.mode
    if (m === 'auto') return 'brightness_auto'
    if (m === true)   return 'dark_mode'
    return 'light_mode'
  })

  const themeTitle = computed(() => {
    const m = $q.dark.mode
    if (m === 'auto') return 'Systemstandard'
    if (m === true)   return 'Dunkelmodus'
    return 'Hellmodus'
  })

  function toggleTheme() {
    const m = $q.dark.mode
    if (m === 'auto') {
      $q.dark.set(true)
      localStorage.setItem(STORAGE_KEY, 'dark')
    } else if (m === true) {
      $q.dark.set(false)
      localStorage.setItem(STORAGE_KEY, 'light')
    } else {
      $q.dark.set('auto')
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return { themeIcon, themeTitle, toggleTheme }
}
