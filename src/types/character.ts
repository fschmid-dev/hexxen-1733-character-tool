export const SCHEMA_VERSION = 1

// ---------------------------------------------------------------------------
// Sub-Modelle
// ---------------------------------------------------------------------------

export type AttributeKey = 'kkr' | 'ath' | 'ges' | 'sin' | 'wis' | 'wil'

export interface ManualBonus {
  value: number
  badgeText: string
  description: string
}

export interface Skill {
  id: string
  name: string
  baseAttribute: AttributeKey
  value: number         // Steigerungswert 0–4
  isCustom: boolean
  manualBonus?: ManualBonus
}

export interface WeaponSkill {
  id: string
  name: string
  baseAttribute: AttributeKey
  baseDamage: number
  apCost: number
  parryModifier: string  // z.B. "-2", "+/-0", "N/A"
  notes: string
  value: number          // Fertigkeitswert 0–4
  isCustom: boolean
  manualBonus?: ManualBonus
}

export interface Weapon {
  id: string
  name: string
  baseDamage: number
  apCost: number
  parryModifier: string
  notes: string
  isActive: boolean
}

export interface ClothingSet {
  id: string
  name: string
  effect: string
  isActive: boolean
}

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  notes: string
}

export interface AcquiredPower {
  id: string
  name: string
  type: 'Allgemein' | 'Esprit' | 'Ausbaukraft' | 'Zauber'
  role: string
  description: string

  // Ausbaukräfte
  ausbauNodes?: {
    stamm: { name: string; effect: string; active: boolean }
    gesellen: { id: string; name: string; effect: string; active: boolean }[]
    experten: { id: string; name: string; effect: string; active: boolean }[]
    meister: { id: string; name: string; effect: string; active: boolean }[]
  }

  // Zauber
  zauberData?: {
    verderbnis: boolean
    magieLehre: string  // z.B. "Nachon"
  }
}

export interface GameEffect {
  id: string
  trigger: 'Passiv' | 'Kampfbeginn' | 'Ini0' | 'EinmalProKampf' | 'SkillProbe' | 'Sonstiges'
  sourceName: string
  description: string
}

export interface JournalNote {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface Companion {
  id: string
  name: string
  level: 1 | 2 | 3
  type: 'Begleiter' | 'Bandenfreund'
  notes: string
}

// ---------------------------------------------------------------------------
// Charakter-Kern
// ---------------------------------------------------------------------------

export interface CharacterSettings {
  useOptionalClothingSets: boolean
  useOptionalMotivations: boolean
}

export interface Character {
  id: string
  schemaVersion: number

  // Stammdaten
  name: string
  playerName: string
  level: number
  volk: string
  profession: string
  masterProfession: string
  roles: [string, string, string]

  settings: CharacterSettings

  // Attribute
  attributes: Record<AttributeKey, number>

  // Ressourcen (current values – Max werden per Getter berechnet wo nötig)
  resources: {
    ambition: number
    rage: number
    segnung: number
    quintessenz: number
    ideen: number        // Max = wis
    coups: number        // Max = ath
    verderbnis: number
    konstruktionspunkte: number
  }

  // Gesundheit
  health: {
    current: number
    buffer: number
    bonusMax: number    // Manueller Bonus auf Max-LEP
  }

  healingFactor: {
    firstAid: 0 | 1 | 2
    magicalHealing: 0 | 1 | 2 | 3 | 4
  }

  statusEffects: {
    malusDamage: number
    externalDamage: number
    internalDamage: number
    paralysis: number
  }

  // Kampf
  initiativeBonus: number
  armor: 1 | 2 | 3
  actionPoints: { current: number }

  finances: {
    upkeep: number
    wealth: number
    loot: number
  }

  // Listen
  skills: {
    general: Skill[]
    fighting: WeaponSkill[]
  }

  weapons: Weapon[]
  clothingSets: ClothingSet[]
  inventory: InventoryItem[]
  companions: Companion[]

  // Kräfte & Zauber
  motivation: { name: string; effectText: string }
  acquiredPowers: AcquiredPower[]
  activeGameEffects: GameEffect[]

  // Journal
  journalNotes: JournalNote[]
}

// ---------------------------------------------------------------------------
// Kompendium
// ---------------------------------------------------------------------------

export interface CompendiumPower {
  id: string
  name: string
  type: AcquiredPower['type']
  role: string
  description: string
  ausbauNodes?: AcquiredPower['ausbauNodes']
  zauberData?: AcquiredPower['zauberData']
}

export interface CompendiumClothingSet {
  id: string
  name: string
  effect: string
}

export interface Compendium {
  id: string            // immer 'default' – es gibt nur ein Kompendium
  schemaVersion: number
  powers: CompendiumPower[]
  clothingSets: CompendiumClothingSet[]
  weapons: Omit<Weapon, 'id' | 'isActive'>[]
}

// ---------------------------------------------------------------------------
// Default-Factories
// ---------------------------------------------------------------------------

export function createDefaultSkills(): Skill[] {
  const defs: [string, AttributeKey][] = [
    ['Akademisches Wissen', 'wis'],
    ['Akrobatik', 'ath'],
    ['Aufmerksamkeit', 'sin'],
    ['Erste Hilfe', 'wis'],
    ['Fingerfertigkeit', 'ges'],
    ['Geistesstärke', 'wil'],
    ['Handwerken', 'ges'],
    ['Heimlichkeit', 'ath'],
    ['Muskelspiel', 'kkr'],
    ['Mystisches Wissen', 'wis'],
    ['Praktisches Wissen', 'wis'],
    ['Recherche', 'sin'],
    ['Redekunst', 'wil'],
    ['Seefahrt', 'wis'],
    ['Unempfindlichkeit', 'kkr'],
  ]
  return defs.map(([name, baseAttribute], i) => ({
    id: `skill-std-${i}`,
    name,
    baseAttribute,
    value: 0,
    isCustom: false,
  }))
}

export function createDefaultWeaponSkills(): WeaponSkill[] {
  const defs: [string, AttributeKey, number, number, string, string][] = [
    ['Fausthieb',     'ath', 0, 1, '-3',    ''],
    ['Dolche',        'ges', 1, 1, '-2',    'Giftverwendung'],
    ['Fechtwaffen',   'ath', 2, 1, '-1',    ''],
    ['Schwerter',     'kkr', 4, 2, '+/-0',  ''],
    ['Schlagwaffen',  'kkr', 5, 2, '-2',    ''],
    ['Stangenwaffen', 'kkr', 8, 3, '+/-0',  ''],
    ['Wurfwaffen',    'ges', 1, 2, 'N/A',   'Angreifer muss freistehen'],
    ['Pistolen',      'sin', 3, 2, 'N/A',   'Immer freie Schussmöglichkeit'],
    ['Armbrüste',     'sin', 5, 2, 'N/A',   'Angreifer muss freistehen'],
    ['Musketen',      'sin', 9, 3, 'N/A',   'Angreifer & Ziel müssen freistehen'],
    ['Ausweichen',    'ath', 0, 1, '-',     'Reduziert gegnerische Treffererfolge'],
  ]
  return defs.map(([name, baseAttribute, baseDamage, apCost, parryModifier, notes], i) => ({
    id: `wpn-std-${i}`,
    name,
    baseAttribute,
    baseDamage,
    apCost,
    parryModifier,
    notes,
    value: 0,
    isCustom: false,
  }))
}

export function createNewCharacter(id: string): Character {
  return {
    id,
    schemaVersion: SCHEMA_VERSION,
    name: 'Neuer Jäger',
    playerName: '',
    level: 1,
    volk: '',
    profession: '',
    masterProfession: '',
    roles: ['', '', ''],
    settings: {
      useOptionalClothingSets: true,
      useOptionalMotivations: true,
    },
    attributes: { kkr: 2, ath: 2, ges: 2, sin: 2, wis: 2, wil: 2 },
    resources: {
      ambition: 0,
      rage: 0,
      segnung: 0,
      quintessenz: 0,
      ideen: 0,
      coups: 0,
      verderbnis: 0,
      konstruktionspunkte: 0,
    },
    health: { current: 11, buffer: 0, bonusMax: 0 },
    healingFactor: { firstAid: 0, magicalHealing: 0 },
    statusEffects: { malusDamage: 0, externalDamage: 0, internalDamage: 0, paralysis: 0 },
    initiativeBonus: 0,
    armor: 1,
    actionPoints: { current: 5 },
    finances: { upkeep: 0, wealth: 0, loot: 0 },
    skills: {
      general: createDefaultSkills(),
      fighting: createDefaultWeaponSkills(),
    },
    weapons: [],
    clothingSets: [],
    inventory: [],
    companions: [],
    motivation: { name: '', effectText: '' },
    acquiredPowers: [],
    activeGameEffects: [],
    journalNotes: [],
  }
}

export function createDefaultCompendium(): Compendium {
  return {
    id: 'default',
    schemaVersion: SCHEMA_VERSION,
    powers: [],
    clothingSets: [],
    weapons: [],
  }
}
