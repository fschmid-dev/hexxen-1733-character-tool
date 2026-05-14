import Dexie, { type Table } from 'dexie'
import type { Character, Compendium } from 'src/types/character'

class HexxenDatabase extends Dexie {
  characters!: Table<Character, string>
  compendium!: Table<Compendium, string>

  constructor() {
    super('HexxenCharacterDB')

    this.version(1).stores({
      characters: 'id, name, schemaVersion',
      compendium: 'id, schemaVersion',
    })
  }
}

export const db = new HexxenDatabase()

export async function loadAllCharacters(): Promise<Character[]> {
  return db.characters.toArray()
}

export async function saveCharacter(character: Character): Promise<void> {
  await db.characters.put(character)
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id)
}

export async function loadCompendium(): Promise<Compendium | undefined> {
  return db.compendium.get('default')
}

export async function saveCompendium(compendium: Compendium): Promise<void> {
  await db.compendium.put(compendium)
}
