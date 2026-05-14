<template>
  <q-page padding class="q-pb-xl">
    <div class="text-h6 q-mb-xs">Kompendium</div>
    <div class="text-caption text-grey-6 q-mb-md">Spielleiter-Verwaltung · Kräfte, Kleidungssets</div>

    <!-- Import / Export -->
    <div class="row q-gutter-xs q-mb-md">
      <q-btn outline color="primary" icon="upload_file" label="Importieren" size="sm" @click="onImport" />
      <q-btn outline color="grey-7" icon="download" label="Exportieren" size="sm" @click="onExport" />
    </div>

    <q-tabs v-model="tab" align="left" dense indicator-color="primary" active-color="primary" class="q-mb-sm">
      <q-tab name="powers" :label="`Kräfte (${compendium.powers.length})`" />
      <q-tab name="sets" :label="`Kleidungssets (${compendium.clothingSets.length})`" />
    </q-tabs>
    <q-separator class="q-mb-sm" />

    <q-tab-panels v-model="tab" animated>
      <!-- Kräfte -->
      <q-tab-panel name="powers" class="q-pa-none">
        <q-input v-model="searchPowers" placeholder="Suchen..." dense outlined clearable class="q-mb-sm">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-list separator bordered>
          <q-item v-for="power in filteredPowers" :key="power.id" class="q-pa-sm">
            <q-item-section>
              <div class="row items-center q-gutter-xs">
                <span class="text-weight-medium">{{ power.name }}</span>
                <q-badge :color="typeColor(power.type)" :label="power.type" />
                <q-badge v-if="power.role" color="grey-5" :label="power.role" />
              </div>
              <div class="text-caption text-grey-6 ellipsis" v-html="power.description" />
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn flat dense round icon="edit" size="xs" @click="openEditPower(power)" />
                <q-btn flat dense round icon="delete_outline" size="xs" color="negative" @click="compStore.removePower(power.id)" />
              </div>
            </q-item-section>
          </q-item>
          <q-item v-if="filteredPowers.length === 0">
            <q-item-section class="text-grey-5 text-caption">Keine Einträge</q-item-section>
          </q-item>
        </q-list>
        <q-btn color="primary" icon="add" label="Kraft hinzufügen" size="sm" unelevated class="q-mt-sm" @click="openAddPower" />
      </q-tab-panel>

      <!-- Kleidungssets -->
      <q-tab-panel name="sets" class="q-pa-none">
        <q-list separator bordered>
          <q-item v-for="set in compendium.clothingSets" :key="set.id" class="q-pa-sm">
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ set.name }}</q-item-label>
              <q-item-label caption>{{ set.effect }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn flat dense round icon="edit" size="xs" @click="openEditSet(set)" />
                <q-btn flat dense round icon="delete_outline" size="xs" color="negative" @click="compStore.removeClothingSet(set.id)" />
              </div>
            </q-item-section>
          </q-item>
          <q-item v-if="compendium.clothingSets.length === 0">
            <q-item-section class="text-grey-5 text-caption">Keine Einträge</q-item-section>
          </q-item>
        </q-list>
        <q-btn color="primary" icon="add" label="Set hinzufügen" size="sm" unelevated class="q-mt-sm" @click="openAddSet" />
      </q-tab-panel>
    </q-tab-panels>

    <!-- Power Dialog -->
    <q-dialog v-model="showPowerDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingPower ? 'Kraft bearbeiten' : 'Kraft hinzufügen' }}</div>
          <q-space /><q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="powerForm.name" label="Name" dense autofocus />
          <q-select v-model="powerForm.type" :options="['Allgemein','Esprit','Ausbaukraft','Zauber']" label="Typ" dense />
          <q-input v-model="powerForm.role" label="Rolle" dense />
          <div class="text-caption text-grey-6 q-mb-xs">Beschreibung</div>
          <q-editor v-model="powerForm.description" min-height="5rem" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" :label="editingPower ? 'Speichern' : 'Hinzufügen'" @click="savePower" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Set Dialog -->
    <q-dialog v-model="showSetDialog">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Kleidungsset</div></q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="setForm.name" label="Name" dense autofocus />
          <q-input v-model="setForm.effect" label="Auswirkung" type="textarea" rows="3" dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" :label="editingSet ? 'Speichern' : 'Hinzufügen'" @click="saveSet" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <input ref="fileInput" type="file" accept=".json" style="display:none" @change="onFileSelected" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import Fuse from 'fuse.js'
import { useCompendiumStore } from 'src/stores/compendiumStore'
import type { CompendiumPower, CompendiumClothingSet } from 'src/types/character'

const compStore = useCompendiumStore()
const $q = useQuasar()
const compendium = computed(() => compStore.compendium)
const tab = ref('powers')
const searchPowers = ref('')

const filteredPowers = computed(() => {
  if (!searchPowers.value.trim()) return compendium.value.powers
  const fuse = new Fuse(compendium.value.powers, { keys: ['name', 'type', 'role'], threshold: 0.4 })
  return fuse.search(searchPowers.value).map(r => r.item)
})

function typeColor(type: string) {
  return ({ Allgemein: 'teal', Esprit: 'purple', Ausbaukraft: 'amber-9', Zauber: 'deep-orange' } as Record<string, string>)[type] ?? 'grey'
}

// Power CRUD
const showPowerDialog = ref(false)
const editingPower = ref<CompendiumPower | null>(null)
const powerForm = ref<{ name: string; type: CompendiumPower['type']; role: string; description: string }>({ name: '', type: 'Allgemein', role: '', description: '' })

function openAddPower() { editingPower.value = null; powerForm.value = { name: '', type: 'Allgemein', role: '', description: '' }; showPowerDialog.value = true }
function openEditPower(p: CompendiumPower) { editingPower.value = p; powerForm.value = { name: p.name, type: p.type, role: p.role, description: p.description }; showPowerDialog.value = true }
async function savePower() {
  if (editingPower.value) await compStore.updatePower(editingPower.value.id, powerForm.value)
  else await compStore.addPower(powerForm.value)
  showPowerDialog.value = false
}

// Set CRUD
const showSetDialog = ref(false)
const editingSet = ref<CompendiumClothingSet | null>(null)
const setForm = ref({ name: '', effect: '' })

function openAddSet() { editingSet.value = null; setForm.value = { name: '', effect: '' }; showSetDialog.value = true }
function openEditSet(s: CompendiumClothingSet) { editingSet.value = s; setForm.value = { name: s.name, effect: s.effect }; showSetDialog.value = true }
async function saveSet() {
  if (editingSet.value) await compStore.updateClothingSet(editingSet.value.id, setForm.value)
  else await compStore.addClothingSet(setForm.value)
  showSetDialog.value = false
}

// Export / Import
function onExport() {
  const blob = new Blob([compStore.exportJSON()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'hexxen-kompendium.json'; a.click()
  URL.revokeObjectURL(url)
}
const fileInput = ref<HTMLInputElement | null>(null)
function onImport() { fileInput.value?.click() }
async function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try { await compStore.importJSON(await file.text()); $q.notify({ type: 'positive', message: 'Kompendium importiert' }) }
  catch (err) { $q.notify({ type: 'negative', message: `Fehler: ${err instanceof Error ? err.message : ''}` }) }
  if (fileInput.value) fileInput.value.value = ''
}
</script>
