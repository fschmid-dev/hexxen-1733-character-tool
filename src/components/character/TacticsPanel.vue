<template>
  <div class="q-gutter-sm q-pb-xl">
    <template v-if="char">
      <div class="row items-center q-mb-md">
        <div class="text-h6 col">Taktik-Dashboard</div>
        <q-btn color="primary" icon="add" label="Effekt hinzufügen" size="sm" unelevated @click="openAddEffect" />
      </div>

      <template v-if="char.activeGameEffects.length === 0">
        <div class="text-grey-5 text-center q-mt-xl">
          <q-icon name="sports_kabaddi" size="64px" />
          <div class="q-mt-sm">Noch keine Taktik-Effekte</div>
        </div>
      </template>

      <!-- Gruppen: erst vordefinierte Auslöser, dann Custom -->
      <template v-for="group in effectGroups" :key="group.trigger">
        <template v-if="group.effects.length > 0">
          <div class="text-overline text-primary q-mb-xs q-mt-md">{{ group.trigger }}</div>
          <q-card flat bordered class="q-mb-sm">
            <draggable
              :model-value="group.effects"
              item-key="id"
              handle=".drag-handle"
              @update:model-value="onGroupReorderEvent(group.trigger, $event)"
            >
              <template #item="{ element: effect }">
                <q-item>
                  <q-item-section avatar class="drag-handle cursor-grab" style="min-width:24px">
                    <q-icon name="drag_indicator" color="grey-5" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ effect.sourceName }}</q-item-label>
                    <q-item-label caption><span v-html="effect.description" /></q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="row q-gutter-xs">
                      <q-btn flat dense round icon="edit" size="xs" @click="openEditEffect(effect)" />
                      <q-btn flat dense round icon="delete_outline" size="xs" color="negative"
                        @click="store.removeGameEffect(effect.id)" />
                    </div>
                  </q-item-section>
                </q-item>
              </template>
            </draggable>
          </q-card>
        </template>
      </template>
    </template>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">{{ editingEffect ? 'Effekt bearbeiten' : 'Taktik-Effekt hinzufügen' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <!-- Quelle: Autocomplete aus bekannten Quellen (use-chips entfernt – Einzelwert) -->
          <q-select
            v-model="form.sourceName"
            :options="filteredSourceOptions"
            label="Quelle"
            dense use-input new-value-mode="add-unique"
            input-debounce="0"
            :color="$q.dark.isActive ? 'secondary' : 'primary'"
            autofocus
            @new-value="(v, done) => done(v, 'add-unique')"
            @filter="filterSources"
          />
          <!-- Auslöser: Autocomplete + freie Eingabe; rohen Tipp-Wert tracken -->
          <q-select
            v-model="form.trigger"
            :options="filteredTriggerOptions"
            label="Auslöser"
            dense use-input new-value-mode="add-unique"
            input-debounce="0"
            :color="$q.dark.isActive ? 'secondary' : 'primary'"
            @new-value="(v, done) => { triggerRawInput = ''; done(v, 'add-unique') }"
            @filter="filterTriggers"
            @update:model-value="() => (triggerRawInput = '')"
          />
          <div class="text-caption text-grey-6 q-mb-xs">Beschreibung</div>
          <q-editor
            v-model="form.description"
            min-height="4rem"
            :toolbar="editorToolbar"
            :definitions="editorDefinitions"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" :label="editingEffect ? 'Speichern' : 'Hinzufügen'" @click="saveEffect" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import { useCharacterStore } from 'src/stores/characterStore'
import { editorToolbar, editorDefinitions } from 'src/composables/useEditorConfig'
import type { GameEffect } from 'src/types/character'

const $q = useQuasar()
const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

// Vordefinierte Auslöser (Reihenfolge = Anzeigereihenfolge der Gruppen)
const predefinedTriggers = [
  'Passiv',
  'Kampfbeginn',
  'Initiative 0',
  'Einmal pro Kampf',
  'Einmal pro Runde',
  'Fertigkeitsprobe',
  'Sonstiges',
]

// Alle verwendeten Auslöser (vordefiniert + custom)
const allTriggers = computed(() => {
  const custom = new Set<string>()
  char.value?.activeGameEffects.forEach(e => {
    if (!predefinedTriggers.includes(e.trigger)) custom.add(e.trigger)
  })
  return [...predefinedTriggers, ...custom]
})

// Effekt-Gruppen in der richtigen Reihenfolge
const effectGroups = computed(() => {
  if (!char.value) return []
  return allTriggers.value.map(trigger => ({
    trigger,
    effects: char.value!.activeGameEffects.filter(e => e.trigger === trigger),
  }))
})

// Quellen-Vorschläge: Rollen, Waffen, Kleidungssets, Motivation
const allSourceOptions = computed(() => {
  if (!char.value) return []
  const sources = new Set<string>()
  char.value.roles.forEach(r => { if (r) sources.add(r) })
  char.value.weapons.forEach(w => { if (w.name) sources.add(w.name) })
  char.value.clothingSets.forEach(s => { if (s.name) sources.add(s.name) })
  if (char.value.motivation.name) sources.add(char.value.motivation.name)
  char.value.acquiredPowers.forEach(p => { if (p.role) sources.add(p.role) })
  return [...sources]
})

const filteredSourceOptions = ref<string[]>([])
function filterSources(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase()
    filteredSourceOptions.value = allSourceOptions.value.filter(s => s.toLowerCase().includes(needle))
  })
}

const filteredTriggerOptions = ref<string[]>(predefinedTriggers)
let triggerRawInput = ''
function filterTriggers(val: string, update: (fn: () => void) => void) {
  triggerRawInput = val
  update(() => {
    const needle = val.toLowerCase()
    filteredTriggerOptions.value = allTriggers.value.filter(t => t.toLowerCase().includes(needle))
  })
}

function onGroupReorderEvent(trigger: string, event: unknown) {
  onGroupReorder(trigger, event as GameEffect[])
}

// Drag & Drop innerhalb einer Gruppe: Positionen innerhalb der Gruppe umnummerieren
function onGroupReorder(trigger: string, newList: GameEffect[]) {
  if (!char.value) return
  const groupIds = new Set(newList.map(e => e.id))
  let ni = 0
  const orderedIds = char.value.activeGameEffects.map(e =>
    groupIds.has(e.id) ? newList[ni++]!.id : e.id,
  )
  store.reorderGameEffects(orderedIds)
}

// Dialog
const showDialog = ref(false)
const editingEffect = ref<GameEffect | null>(null)
const form = ref<Omit<GameEffect, 'id'>>({ trigger: 'Passiv', sourceName: '', description: '' })

function openAddEffect() {
  editingEffect.value = null
  form.value = { trigger: 'Passiv', sourceName: '', description: '' }
  showDialog.value = true
}

function openEditEffect(effect: GameEffect) {
  editingEffect.value = effect
  form.value = { trigger: effect.trigger, sourceName: effect.sourceName, description: effect.description }
  showDialog.value = true
}

function saveEffect() {
  if (!form.value.sourceName) return
  // Uncommitted trigger text (user typed but didn't press Enter / select)
  if (triggerRawInput) form.value.trigger = triggerRawInput
  const data = { ...form.value }
  if (editingEffect.value) store.updateGameEffect(editingEffect.value.id, data)
  else store.addGameEffect(data)
  showDialog.value = false
}
</script>
