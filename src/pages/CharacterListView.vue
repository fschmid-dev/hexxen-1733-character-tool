<template>
  <q-page padding class="q-pb-xl">
    <!-- Suche + Import -->
    <div class="row q-gutter-sm q-mb-md items-center">
      <q-input
        v-model="search"
        placeholder="Suchen..."
        dense outlined clearable class="col"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-btn flat round icon="upload_file" title="Aus Datei importieren" @click="onImportFile" />
      <q-btn flat round icon="content_paste" title="Aus JSON-Text importieren" @click="showImportDialog = true" />
    </div>

    <!-- Leerzustand -->
    <div v-if="filteredCharacters.length === 0" class="text-center q-mt-xl text-grey-5">
      <q-icon name="person_off" size="64px" />
      <div class="q-mt-sm">{{ search ? 'Keine Treffer' : 'Noch keine Charaktere' }}</div>
      <q-btn
        v-if="!search"
        color="primary" icon="person_add" label="Jäger erstellen"
        class="q-mt-md" unelevated rounded
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Charakterliste -->
    <div class="q-gutter-sm">
      <q-card
        v-for="char in filteredCharacters"
        :key="char.id"
        flat bordered class="cursor-pointer"
        @click="openCharacter(char.id)"
      >
        <q-card-section class="q-pa-sm">
          <div class="row items-center no-wrap q-gutter-sm">
            <div class="col overflow-hidden">
              <div class="text-subtitle2 text-weight-bold ellipsis">{{ char.name }}</div>
              <div class="text-caption text-grey-6">
                Stufe {{ char.level }}
                <span v-if="char.profession"> · {{ char.profession }}</span>
                <span v-if="char.volk"> · {{ char.volk }}</span>
              </div>
              <div class="row q-gutter-xs q-mt-xs">
                <q-badge
                  v-for="role in char.roles.filter(r => r)"
                  :key="role"
                  color="primary" outline
                  :label="role"
                />
              </div>
            </div>
            <!-- LEP Anzeige -->
            <div class="col-auto text-right q-mr-sm">
              <div class="text-caption text-grey-5">LEP</div>
              <div
                class="text-subtitle1 text-weight-bold"
                :class="lepColor(char)"
              >
                {{ char.health.current }}/{{ maxHealth(char) }}
              </div>
            </div>
            <!-- Aktionen -->
            <q-btn
              flat round dense icon="more_vert" size="sm"
              @click.stop
            >
              <q-menu>
                <q-list dense>
                  <q-item clickable v-close-popup @click="exportChar(char.id)">
                    <q-item-section avatar><q-icon name="download" /></q-item-section>
                    <q-item-section>Exportieren</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup class="text-negative" @click="confirmDelete(char)">
                    <q-item-section avatar><q-icon name="delete_outline" color="negative" /></q-item-section>
                    <q-item-section>Löschen</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- FAB: Neuer Charakter -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="person_add" color="primary" @click="showCreateDialog = true" />
    </q-page-sticky>

    <!-- Create Dialog -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Neuen Jäger erstellen</div></q-card-section>
        <q-card-section>
          <q-input v-model="newName" label="Jägername" autofocus @keyup.enter="createCharacter" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" label="Erstellen" :disable="!newName.trim()" @click="createCharacter" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Import aus JSON-Text Dialog -->
    <q-dialog v-model="showImportDialog">
      <q-card style="min-width: 340px; max-width: 600px">
        <q-card-section><div class="text-h6">Charakter aus JSON importieren</div></q-card-section>
        <q-card-section>
          <q-input
            v-model="importJson"
            type="textarea"
            label="JSON hier einfügen"
            rows="10"
            outlined
            autofocus
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" label="Importieren" :disable="!importJson.trim()" @click="onImportJson" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Hidden import input -->
    <input ref="fileInput" type="file" accept=".json" style="display:none" @change="onFileSelected" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import Fuse from 'fuse.js'
import { useCharacterStore } from 'src/stores/characterStore'
import type { Character } from 'src/types/character'

const store = useCharacterStore()
const router = useRouter()
const $q = useQuasar()

const search = ref('')

const filteredCharacters = computed(() => {
  if (!search.value.trim()) return store.characters
  const fuse = new Fuse(store.characters, {
    keys: ['name', 'volk', 'profession', 'roles'],
    threshold: 0.4,
  })
  return fuse.search(search.value).map(r => r.item)
})

function maxHealth(char: Character) {
  return char.attributes.kkr + char.attributes.wil + 7 + char.health.bonusMax
}

function lepColor(char: Character) {
  const pct = char.health.current / maxHealth(char)
  if (pct > 0.6) return 'text-green-7'
  if (pct > 0.3) return 'text-orange-7'
  return 'text-negative'
}

function openCharacter(id: string) {
  store.switchCharacter(id)
  void router.push(`/characters/${id}`)
}

// Export
function exportChar(id: string) {
  try {
    const json = store.exportCharacterJSON(id)
    const char = store.characters.find(c => c.id === id)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(char?.name ?? 'charakter').replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    $q.notify({ type: 'negative', message: 'Export fehlgeschlagen' })
  }
}

// Löschen
function confirmDelete(char: Character) {
  $q.dialog({
    title: 'Charakter löschen',
    message: `„${char.name}" wirklich löschen?`,
    ok: { label: 'Löschen', color: 'negative' },
    cancel: { label: 'Abbrechen', flat: true },
  }).onOk(() => {
    void store.deleteCharacter(char.id)
  })
}

// Erstellen
const showCreateDialog = ref(false)
const newName = ref('')

async function createCharacter() {
  const name = newName.value.trim()
  if (!name) return
  showCreateDialog.value = false
  const id = await store.createCharacter(name)
  void router.push(`/characters/${id}`)
}

// Import aus Datei
const fileInput = ref<HTMLInputElement | null>(null)
function onImportFile() { fileInput.value?.click() }
async function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await doImport(await file.text())
  if (fileInput.value) fileInput.value.value = ''
}

// Import aus JSON-Text
const showImportDialog = ref(false)
const importJson = ref('')

async function onImportJson() {
  await doImport(importJson.value)
  showImportDialog.value = false
  importJson.value = ''
}

async function doImport(json: string) {
  try {
    await store.importCharacterJSON(json)
    $q.notify({ type: 'positive', message: 'Charakter importiert' })
  } catch (err) {
    $q.notify({ type: 'negative', message: `Import fehlgeschlagen: ${err instanceof Error ? err.message : ''}` })
  }
}
</script>
