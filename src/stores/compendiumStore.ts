import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uid } from 'quasar'
import type { Compendium, CompendiumPower, CompendiumClothingSet } from 'src/types/character'
import { createDefaultCompendium, SCHEMA_VERSION } from 'src/types/character'
import { loadCompendium, saveCompendium } from 'src/db/database'

export const useCompendiumStore = defineStore('compendium', () => {
  const compendium = ref<Compendium>(createDefaultCompendium())

  async function loadFromDB(): Promise<void> {
    const stored = await loadCompendium()
    if (stored) compendium.value = stored
  }

  async function persist(): Promise<void> {
    await saveCompendium(compendium.value)
  }

  // ---------------------------------------------------------------------------
  // Kräfte
  // ---------------------------------------------------------------------------
  async function addPower(power: Omit<CompendiumPower, 'id'>): Promise<void> {
    compendium.value.powers.push({ ...power, id: uid() })
    await persist()
  }

  async function updatePower(id: string, data: Partial<Omit<CompendiumPower, 'id'>>): Promise<void> {
    const p = compendium.value.powers.find(x => x.id === id)
    if (p) { Object.assign(p, data); await persist() }
  }

  async function removePower(id: string): Promise<void> {
    compendium.value.powers = compendium.value.powers.filter(p => p.id !== id)
    await persist()
  }

  // ---------------------------------------------------------------------------
  // Kleidungssets
  // ---------------------------------------------------------------------------
  async function addClothingSet(set: Omit<CompendiumClothingSet, 'id'>): Promise<void> {
    compendium.value.clothingSets.push({ ...set, id: uid() })
    await persist()
  }

  async function updateClothingSet(id: string, data: Partial<Omit<CompendiumClothingSet, 'id'>>): Promise<void> {
    const s = compendium.value.clothingSets.find(x => x.id === id)
    if (s) { Object.assign(s, data); await persist() }
  }

  async function removeClothingSet(id: string): Promise<void> {
    compendium.value.clothingSets = compendium.value.clothingSets.filter(s => s.id !== id)
    await persist()
  }

  // ---------------------------------------------------------------------------
  // Import / Export
  // ---------------------------------------------------------------------------
  function exportJSON(): string {
    return JSON.stringify(compendium.value, null, 2)
  }

  async function importJSON(json: string): Promise<void> {
    const data = JSON.parse(json) as Compendium
    if (typeof data.schemaVersion !== 'number') {
      throw new Error('Ungültiges Kompendium-Format')
    }
    if (data.schemaVersion > SCHEMA_VERSION) {
      throw new Error(`Kompendiumversion ${data.schemaVersion} wird nicht unterstützt`)
    }
    compendium.value = { ...createDefaultCompendium(), ...data, id: 'default' }
    await persist()
  }

  return {
    compendium,
    loadFromDB,
    addPower,
    updatePower,
    removePower,
    addClothingSet,
    updateClothingSet,
    removeClothingSet,
    exportJSON,
    importJSON,
  }
})
