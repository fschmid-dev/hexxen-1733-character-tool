<template>
  <q-page padding>
    <!-- Begrüßung -->
    <div class="text-h5 text-weight-bold q-mb-xs">Willkommen</div>
    <div class="text-body2 text-grey-6 q-mb-lg">HeXXen 1733 – Digitaler Jägerbogen</div>

    <!-- Schnellzugriff: Letzte Charaktere -->
    <div class="text-overline text-primary q-mb-sm">Charaktere</div>
    <div class="row q-gutter-sm q-mb-md">
      <!-- Charakter-Kacheln -->
      <q-card
        v-for="char in recentCharacters"
        :key="char.id"
        class="col-12 col-sm-5 cursor-pointer"
        flat bordered
        @click="openCharacter(char.id)"
      >
        <q-card-section class="q-pa-md">
          <div class="row items-center no-wrap q-gutter-sm">
            <div class="col overflow-hidden">
              <div class="text-subtitle1 text-weight-bold ellipsis">{{ char.name }}</div>
              <div class="text-caption text-grey-6">
                Stufe {{ char.level }}
                <span v-if="char.volk"> · {{ char.volk }}</span>
              </div>
              <div class="row q-gutter-xs q-mt-xs">
                <q-badge
                  v-for="role in char.roles.filter(r => r)"
                  :key="role"
                  color="primary"
                  :label="role"
                />
              </div>
            </div>
            <div class="col-auto text-right">
              <div class="text-caption text-grey-5">LEP</div>
              <div class="text-h6 text-weight-bold text-primary">{{ char.health.current }}</div>
              <div class="text-caption text-grey-5">/ {{ maxHealth(char) }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Kachel: Neuer Charakter -->
      <q-card
        class="col-12 col-sm-5 cursor-pointer"
        flat bordered
        style="border-style: dashed"
        @click="showCreateDialog = true"
      >
        <q-card-section class="flex flex-center q-pa-md">
          <div class="text-center text-grey-5">
            <q-icon name="person_add" size="36px" />
            <div class="text-body2 q-mt-xs">Neuen Jäger erstellen</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Alle Charaktere -->
    <q-btn
      v-if="store.characters.length > 0"
      flat color="primary" icon="people" label="Alle Charaktere"
      @click="$router.push('/characters')"
    />

    <q-separator class="q-my-lg" />

    <!-- Kompendium-Kachel -->
    <div class="text-overline text-primary q-mb-sm">Spielleitung</div>
    <q-card
      flat bordered class="cursor-pointer"
      style="max-width: 400px"
      @click="$router.push('/compendium')"
    >
      <q-card-section class="row items-center q-gutter-md">
        <q-avatar color="grey-8" text-color="white" icon="library_books" size="48px" />
        <div>
          <div class="text-subtitle1 text-weight-bold">Kompendium</div>
          <div class="text-caption text-grey-6">
            {{ compendiumStats }}
          </div>
        </div>
        <q-space />
        <q-icon name="chevron_right" color="grey-5" />
      </q-card-section>
    </q-card>

    <!-- Neuer Charakter Dialog -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Neuen Jäger erstellen</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="newName"
            label="Jägername"
            autofocus
            @keyup.enter="createCharacter"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn
            color="primary" label="Erstellen"
            :disable="!newName.trim()"
            @click="createCharacter"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from 'src/stores/characterStore'
import { useCompendiumStore } from 'src/stores/compendiumStore'
import type { Character } from 'src/types/character'

const store = useCharacterStore()
const compStore = useCompendiumStore()
const router = useRouter()

// Zeige max. 4 Charaktere auf dem Dashboard
const recentCharacters = computed(() => store.characters.slice(0, 4))

const compendiumStats = computed(() => {
  const c = compStore.compendium
  const parts: string[] = []
  if (c.powers.length) parts.push(`${c.powers.length} Kräfte`)
  if (c.clothingSets.length) parts.push(`${c.clothingSets.length} Kleidungssets`)
  return parts.length ? parts.join(' · ') : 'Noch keine Einträge'
})

function maxHealth(char: Character): number {
  return char.attributes.kkr + char.attributes.wil + 7 + char.health.bonusMax
}

function openCharacter(id: string) {
  store.switchCharacter(id)
  void router.push(`/characters/${id}`)
}

// Charakter anlegen
const showCreateDialog = ref(false)
const newName = ref('')

async function createCharacter() {
  const name = newName.value.trim()
  if (!name) return
  showCreateDialog.value = false
  const id = await store.createCharacter(name)
  void router.push(`/characters/${id}`)
}
</script>
