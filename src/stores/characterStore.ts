import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uid } from 'quasar'
import type {
  Character, Skill, Weapon, ClothingSet,
  InventoryItem, AcquiredPower, GameEffect, JournalNote, Companion, ManualBonus,
} from 'src/types/character'
import { createNewCharacter, SCHEMA_VERSION } from 'src/types/character'
import {
  loadAllCharacters, saveCharacter, deleteCharacter as dbDeleteCharacter,
} from 'src/db/database'

export const useCharacterStore = defineStore('character', () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const characters = ref<Character[]>([])
  const activeCharacterId = ref<string | null>(null)

  // ---------------------------------------------------------------------------
  // Aktiver Charakter
  // ---------------------------------------------------------------------------
  const activeCharacter = computed<Character | null>(() =>
    characters.value.find(c => c.id === activeCharacterId.value) ?? null,
  )

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  const maxHealth = computed<number>(() => {
    const c = activeCharacter.value
    if (!c) return 0
    return c.attributes.kkr + c.attributes.wil + 7 + c.health.bonusMax
  })

  const maxAP = computed<number>(() => {
    const c = activeCharacter.value
    if (!c) return 0
    return 6 - c.armor
  })

  const initiativeBase = computed<number>(() => {
    const c = activeCharacter.value
    if (!c) return 0
    return c.attributes.sin + c.attributes.ges
  })

  const initiative = computed<number>(() => {
    const c = activeCharacter.value
    if (!c) return 0
    return c.attributes.sin + c.attributes.ges + c.initiativeBonus
  })

  const maxHealthBase = computed<number>(() => {
    const c = activeCharacter.value
    if (!c) return 0
    return c.attributes.kkr + c.attributes.wil + 7
  })

  const maxIdeen = computed<number>(() => activeCharacter.value?.attributes.wis ?? 0)
  const maxCoups = computed<number>(() => activeCharacter.value?.attributes.ath ?? 0)

  function skillTotal(skillId: string): number {
    const c = activeCharacter.value
    if (!c) return 0
    const allSkills = [...c.skills.general, ...c.skills.fighting]
    const skill = allSkills.find(s => s.id === skillId)
    if (!skill) return 0
    const attrVal = c.attributes[skill.baseAttribute] ?? 0
    const bonus = skill.manualBonus?.value ?? 0
    return skill.value + attrVal + bonus
  }

  // ---------------------------------------------------------------------------
  // Persistenz
  // ---------------------------------------------------------------------------
  async function persist(char: Character): Promise<void> {
    await saveCharacter(JSON.parse(JSON.stringify(char)) as Character)
  }

  function _mutate(fn: (c: Character) => void): void {
    const c = activeCharacter.value
    if (!c) return
    fn(c)
    void persist(c)
  }

  // ---------------------------------------------------------------------------
  // Charakter-Verwaltung
  // ---------------------------------------------------------------------------
  async function loadFromDB(): Promise<void> {
    characters.value = await loadAllCharacters()
    if (characters.value.length > 0 && !activeCharacterId.value) {
      activeCharacterId.value = characters.value[0]!.id
    }
  }

  async function createCharacter(name: string): Promise<string> {
    const id = uid()
    const char = createNewCharacter(id)
    char.name = name
    characters.value.push(char)
    await saveCharacter(char)
    activeCharacterId.value = id
    return id
  }

  async function deleteCharacter(id: string): Promise<void> {
    await dbDeleteCharacter(id)
    const idx = characters.value.findIndex(c => c.id === id)
    if (idx !== -1) characters.value.splice(idx, 1)
    if (activeCharacterId.value === id) {
      activeCharacterId.value = characters.value[0]?.id ?? null
    }
  }

  function switchCharacter(id: string): void {
    if (characters.value.some(c => c.id === id)) {
      activeCharacterId.value = id
    }
  }

  // ---------------------------------------------------------------------------
  // Stammdaten
  // ---------------------------------------------------------------------------
  function updateField<K extends keyof Character>(key: K, value: Character[K]): void {
    _mutate(c => { c[key] = value })
  }

  function updateAttribute(attr: keyof Character['attributes'], value: number): void {
    _mutate(c => { c.attributes[attr] = Math.max(1, Math.min(6, value)) })
  }

  function updateResource(key: keyof Character['resources'], value: number): void {
    _mutate(c => { c.resources[key] = Math.max(0, value) })
  }

  // ---------------------------------------------------------------------------
  // Gesundheit & Kampf
  // ---------------------------------------------------------------------------
  function setCurrentHealth(value: number): void {
    _mutate(c => { c.health.current = Math.max(0, Math.min(value, maxHealth.value)) })
  }

  function setCurrentAP(value: number): void {
    _mutate(c => { c.actionPoints.current = Math.max(0, Math.min(value, maxAP.value)) })
  }

  function setBufferHealth(value: number): void {
    _mutate(c => { c.health.buffer = Math.max(0, value) })
  }

  function resetAP(): void {
    _mutate(c => { c.actionPoints.current = maxAP.value })
  }

  function updateStatusEffect(key: keyof Character['statusEffects'], value: number): void {
    _mutate(c => { c.statusEffects[key] = Math.max(0, value) })
  }

  // ---------------------------------------------------------------------------
  // Skills
  // ---------------------------------------------------------------------------
  function updateSkillValue(skillId: string, value: number): void {
    _mutate(c => {
      const skill = [...c.skills.general, ...c.skills.fighting].find(s => s.id === skillId)
      if (skill) skill.value = Math.max(0, Math.min(4, value))
    })
  }

  function setSkillBonus(skillId: string, bonus: ManualBonus | undefined): void {
    _mutate(c => {
      const skill = [...c.skills.general, ...c.skills.fighting].find(s => s.id === skillId)
      if (skill) {
        if (bonus !== undefined) skill.manualBonus = bonus
        else delete skill.manualBonus
      }
    })
  }

  function addCustomSkill(skill: Omit<Skill, 'id' | 'isCustom'>): void {
    _mutate(c => {
      c.skills.general.push({ ...skill, id: uid(), isCustom: true })
    })
  }

  function removeCustomSkill(skillId: string): void {
    _mutate(c => {
      c.skills.general = c.skills.general.filter(s => s.id !== skillId || !s.isCustom)
    })
  }

  // ---------------------------------------------------------------------------
  // Waffen (eigene Waffen, nicht Waffenfertigkeiten)
  // ---------------------------------------------------------------------------
  function addWeapon(weapon: Omit<Weapon, 'id'>): void {
    _mutate(c => { c.weapons.push({ ...weapon, id: uid() }) })
  }

  function updateWeapon(id: string, data: Partial<Omit<Weapon, 'id'>>): void {
    _mutate(c => {
      const w = c.weapons.find(x => x.id === id)
      if (w) Object.assign(w, data)
    })
  }

  function removeWeapon(id: string): void {
    _mutate(c => { c.weapons = c.weapons.filter(w => w.id !== id) })
  }

  // ---------------------------------------------------------------------------
  // Kleidungssets
  // ---------------------------------------------------------------------------
  function addClothingSet(set: Omit<ClothingSet, 'id' | 'isActive'>): void {
    _mutate(c => {
      if (c.clothingSets.length < 3) {
        c.clothingSets.push({ ...set, id: uid(), isActive: c.clothingSets.length === 0 })
      }
    })
  }

  function updateClothingSet(id: string, data: Partial<Omit<ClothingSet, 'id'>>): void {
    _mutate(c => {
      const s = c.clothingSets.find(x => x.id === id)
      if (s) Object.assign(s, data)
    })
  }

  function setActiveClothingSet(id: string): void {
    _mutate(c => { c.clothingSets.forEach(s => { s.isActive = s.id === id }) })
  }

  function removeClothingSet(id: string): void {
    _mutate(c => { c.clothingSets = c.clothingSets.filter(s => s.id !== id) })
  }

  // ---------------------------------------------------------------------------
  // Inventar
  // ---------------------------------------------------------------------------
  function addInventoryItem(item: Omit<InventoryItem, 'id'>): void {
    _mutate(c => { c.inventory.push({ ...item, id: uid() }) })
  }

  function updateInventoryItem(id: string, data: Partial<Omit<InventoryItem, 'id'>>): void {
    _mutate(c => {
      const item = c.inventory.find(x => x.id === id)
      if (item) Object.assign(item, data)
    })
  }

  function removeInventoryItem(id: string): void {
    _mutate(c => { c.inventory = c.inventory.filter(i => i.id !== id) })
  }

  // ---------------------------------------------------------------------------
  // Gefolge
  // ---------------------------------------------------------------------------
  function addCompanion(companion: Omit<Companion, 'id'>): void {
    _mutate(c => { c.companions.push({ ...companion, id: uid() }) })
  }

  function updateCompanion(id: string, data: Partial<Omit<Companion, 'id'>>): void {
    _mutate(c => {
      const comp = c.companions.find(x => x.id === id)
      if (comp) Object.assign(comp, data)
    })
  }

  function removeCompanion(id: string): void {
    _mutate(c => { c.companions = c.companions.filter(x => x.id !== id) })
  }

  // ---------------------------------------------------------------------------
  // Kräfte & Zauber
  // ---------------------------------------------------------------------------
  function addPower(power: Omit<AcquiredPower, 'id'>): void {
    _mutate(c => { c.acquiredPowers.push({ ...power, id: uid() }) })
  }

  function updatePower(id: string, data: Partial<Omit<AcquiredPower, 'id'>>): void {
    _mutate(c => {
      const p = c.acquiredPowers.find(x => x.id === id)
      if (p) Object.assign(p, data)
    })
  }

  function toggleAusbauNode(
    powerId: string,
    tier: 'gesellen' | 'experten' | 'meister',
    nodeId: string,
  ): void {
    _mutate(c => {
      const p = c.acquiredPowers.find(x => x.id === powerId)
      if (!p?.ausbauNodes) return
      const node = p.ausbauNodes[tier].find(n => n.id === nodeId)
      if (node) node.active = !node.active
    })
  }

  function removePower(id: string): void {
    _mutate(c => { c.acquiredPowers = c.acquiredPowers.filter(p => p.id !== id) })
  }

  // ---------------------------------------------------------------------------
  // Taktik-Effekte
  // ---------------------------------------------------------------------------
  function addGameEffect(effect: Omit<GameEffect, 'id'>): void {
    _mutate(c => { c.activeGameEffects.push({ ...effect, id: uid() }) })
  }

  function removeGameEffect(id: string): void {
    _mutate(c => { c.activeGameEffects = c.activeGameEffects.filter(e => e.id !== id) })
  }

  // ---------------------------------------------------------------------------
  // Journal
  // ---------------------------------------------------------------------------
  function addJournalNote(note: Omit<JournalNote, 'id' | 'createdAt' | 'updatedAt'>): void {
    const now = Date.now()
    _mutate(c => { c.journalNotes.push({ ...note, id: uid(), createdAt: now, updatedAt: now }) })
  }

  function updateJournalNote(id: string, data: Partial<Pick<JournalNote, 'title' | 'content' | 'tags'>>): void {
    _mutate(c => {
      const note = c.journalNotes.find(n => n.id === id)
      if (note) { Object.assign(note, data); note.updatedAt = Date.now() }
    })
  }

  function removeJournalNote(id: string): void {
    _mutate(c => { c.journalNotes = c.journalNotes.filter(n => n.id !== id) })
  }

  // ---------------------------------------------------------------------------
  // Import / Export
  // ---------------------------------------------------------------------------
  function exportCharacterJSON(id?: string): string {
    const char = id
      ? characters.value.find(c => c.id === id)
      : activeCharacter.value
    if (!char) throw new Error('Kein Charakter gefunden')
    return JSON.stringify(char, null, 2)
  }

  async function importCharacterJSON(json: string): Promise<void> {
    const data = JSON.parse(json) as Character
    if (typeof data.schemaVersion !== 'number') {
      throw new Error('Ungültiges Charakterformat: schemaVersion fehlt')
    }
    if (data.schemaVersion > SCHEMA_VERSION) {
      throw new Error(`Charakterversion ${data.schemaVersion} wird nicht unterstützt`)
    }
    // Einfache Migration: fehlende Felder mit Defaults auffüllen
    const migrated: Character = { ...createNewCharacter(data.id ?? uid()), ...data }
    const existing = characters.value.findIndex(c => c.id === migrated.id)
    if (existing !== -1) {
      characters.value[existing] = migrated
    } else {
      characters.value.push(migrated)
    }
    await saveCharacter(migrated)
    activeCharacterId.value = migrated.id
  }

  return {
    // State
    characters,
    activeCharacterId,
    // Getters
    activeCharacter,
    maxHealth,
    maxHealthBase,
    maxAP,
    initiativeBase,
    initiative,
    maxIdeen,
    maxCoups,
    skillTotal,
    // Charakter-Verwaltung
    loadFromDB,
    createCharacter,
    deleteCharacter,
    switchCharacter,
    // Felder
    updateField,
    updateAttribute,
    updateResource,
    // Gesundheit & Kampf
    setCurrentHealth,
    setCurrentAP,
    setBufferHealth,
    resetAP,
    updateStatusEffect,
    // Skills
    updateSkillValue,
    setSkillBonus,
    addCustomSkill,
    removeCustomSkill,
    // Waffen
    addWeapon,
    updateWeapon,
    removeWeapon,
    // Kleidungssets
    addClothingSet,
    updateClothingSet,
    setActiveClothingSet,
    removeClothingSet,
    // Inventar
    addInventoryItem,
    updateInventoryItem,
    removeInventoryItem,
    // Gefolge
    addCompanion,
    updateCompanion,
    removeCompanion,
    // Kräfte
    addPower,
    updatePower,
    toggleAusbauNode,
    removePower,
    // Taktik
    addGameEffect,
    removeGameEffect,
    // Journal
    addJournalNote,
    updateJournalNote,
    removeJournalNote,
    // Import/Export
    exportCharacterJSON,
    importCharacterJSON,
  }
})
