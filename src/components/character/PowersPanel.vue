<template>
  <div class="q-gutter-sm q-pb-xl">
    <template v-if="char">

      <!-- Filter-Zeile: Typ + Quelle + Hinzufügen -->
      <div class="row q-gutter-xs q-mb-sm items-center q-px-sm">
        <q-btn-toggle
          v-model="filterType"
          :options="typeOptions"
          unelevated dense size="sm"
          toggle-color="primary"
          :color="$q.dark.isActive ? 'grey-8' : 'grey-2'"
          :text-color="$q.dark.isActive ? 'grey-3' : 'grey-8'"
        />
        <q-btn-toggle
          v-if="sourceOptions.length > 0"
          v-model="filterSource"
          :options="sourceFilterOptions"
          unelevated dense size="sm"
          toggle-color="primary"
          :color="$q.dark.isActive ? 'grey-8' : 'grey-2'"
          :text-color="$q.dark.isActive ? 'grey-3' : 'grey-8'"
        />
        <q-space />
        <q-btn color="primary" icon="add" label="Kraft hinzufügen" size="sm" unelevated @click="openAddDialog" />
      </div>

      <!-- Kräfte-Liste -->
      <draggable
        :model-value="filteredPowers"
        item-key="id"
        handle=".drag-handle"
        class="q-gutter-sm"
        @update:model-value="onPowersReorder"
      >
        <template #item="{ element: power }">
          <q-card flat bordered>
            <q-card-section class="q-pa-sm">
              <div class="row items-center q-gutter-xs q-mb-xs">
                <q-icon name="drag_indicator" class="drag-handle cursor-grab text-grey-5" size="sm" />
                <div class="text-subtitle2 text-weight-bold col">{{ power.name }}</div>
                <q-badge :color="typeColor(power.type)" :label="power.type" />
                <q-badge v-if="power.role" color="grey-7" text-color="white" :label="power.role" />
                <q-btn flat dense round icon="edit" size="xs" @click="openEditDialog(power)" />
                <q-btn flat dense round icon="delete_outline" size="xs" color="negative" @click="store.removePower(power.id)" />
              </div>

              <div v-if="power.description" class="text-body2 text-grey-8 q-mb-sm" v-html="power.description" />

              <!-- Ausbaukraft-Nodes (nur aktive + nicht-leere anzeigen) -->
              <template v-if="power.type === 'Ausbaukraft' && power.ausbauNodes">
                <q-separator class="q-mb-sm" />
                <!-- Stammeffekt: immer anzeigen wenn nicht leer -->
                <div v-if="power.ausbauNodes.stamm.name || power.ausbauNodes.stamm.effect"
                  class="power-node power-node--stamm q-pl-sm q-mb-xs">
                  <div class="row items-start q-gutter-xs">
                    <q-badge color="amber-9" label="S" class="q-mt-xs" />
                    <div class="col">
                      <div class="text-body2 text-weight-medium">{{ power.ausbauNodes.stamm.name || 'Stammeffekt' }}</div>
                      <div v-if="power.ausbauNodes.stamm.effect" class="text-caption text-grey-6" v-html="power.ausbauNodes.stamm.effect" />
                    </div>
                  </div>
                </div>
                <!-- Geselleneffekte: nur aktive und nicht-leere -->
                <div v-for="node in activeNodes(power.ausbauNodes.gesellen)" :key="node.id"
                  class="power-node power-node--geselle q-pl-sm q-mb-xs">
                  <div class="row items-start q-gutter-xs">
                    <q-badge color="green-8" label="G" class="q-mt-xs" />
                    <div class="col">
                      <div class="text-body2 text-weight-medium">{{ node.name }}</div>
                      <div v-if="node.effect" class="text-caption text-grey-6" v-html="node.effect" />
                    </div>
                  </div>
                </div>
                <!-- Experteneffekte -->
                <div v-for="node in activeNodes(power.ausbauNodes.experten)" :key="node.id"
                  class="power-node power-node--experte q-pl-sm q-mb-xs">
                  <div class="row items-start q-gutter-xs">
                    <q-badge color="blue-8" label="E" class="q-mt-xs" />
                    <div class="col">
                      <div class="text-body2 text-weight-medium">{{ node.name }}</div>
                      <div v-if="node.effect" class="text-caption text-grey-6" v-html="node.effect" />
                    </div>
                  </div>
                </div>
                <!-- Meistereffekte -->
                <div v-for="node in activeNodes(power.ausbauNodes.meister)" :key="node.id"
                  class="power-node power-node--meister q-pl-sm q-mb-xs">
                  <div class="row items-start q-gutter-xs">
                    <q-badge color="purple-8" label="M" class="q-mt-xs" />
                    <div class="col">
                      <div class="text-body2 text-weight-medium">{{ node.name }}</div>
                      <div v-if="node.effect" class="text-caption text-grey-6" v-html="node.effect" />
                    </div>
                  </div>
                </div>
              </template>
            </q-card-section>
          </q-card>
        </template>
      </draggable>

      <div v-if="filteredPowers.length === 0" class="text-grey-5 text-center q-mt-xl">
        <q-icon name="auto_fix_high" size="64px" />
        <div class="q-mt-sm">Keine Kräfte gefunden</div>
      </div>
    </template>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showPowerDialog" maximized>
      <q-card>
        <q-card-section class="row items-center bg-primary text-white q-pa-sm">
          <div class="text-h6 col">{{ editingPower ? 'Kraft bearbeiten' : 'Kraft hinzufügen' }}</div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-sm q-pa-md">
          <q-input v-model="powerForm.name" label="Name" dense autofocus />
          <q-select
            v-model="powerForm.type"
            :options="['Allgemein','Esprit','Ausbaukraft']"
            label="Typ" dense
            color="secondary"
          />
          <q-select
            v-model="powerForm.role"
            :options="roleOptions"
            label="Rolle (optional)"
            dense use-input use-chips new-value-mode="add-unique"
            input-debounce="0"
            @new-value="(v, done) => done(v, 'add-unique')"
          />
          <div class="text-caption text-grey-6 q-mb-xs">Beschreibung</div>
          <q-editor v-model="powerForm.description" min-height="5rem" :toolbar="editorToolbar" :definitions="editorDefinitions" />

          <!-- Ausbaukraft-Stufen -->
          <template v-if="powerForm.type === 'Ausbaukraft'">
            <q-separator class="q-my-sm" />

            <!-- Stammeffekt (immer aktiv, kein Toggle) -->
            <div class="text-subtitle2 q-mb-xs" style="border-left: 3px solid #c0682b; padding-left: 8px">Stammeffekt</div>
            <q-card flat bordered class="q-mb-sm">
              <q-card-section class="q-pa-sm q-gutter-xs">
                <q-input v-model="nodeTexts.stamm.name" label="Name" dense />
                <div class="text-caption text-grey-6 q-mb-xs">Effekt</div>
                <q-editor v-model="nodeTexts.stamm.effect" min-height="3rem" :toolbar="editorToolbar" :definitions="editorDefinitions" />
              </q-card-section>
            </q-card>

            <!-- Geselleneffekte -->
            <div class="text-subtitle2 q-mb-xs q-mt-sm" style="border-left: 3px solid #4caf50; padding-left: 8px">Geselleneffekte</div>
            <q-card v-for="(node, i) in nodeTexts.gesellen" :key="'g'+i" flat bordered class="q-mb-xs">
              <q-card-section class="q-pa-sm q-gutter-xs">
                <div class="row items-center q-mb-xs">
                  <div class="text-caption text-grey-6 col">Geselleneffekt {{ i + 1 }}</div>
                  <q-toggle :model-value="node.active" dense size="sm" color="primary" label="Aktiv"
                    @update:model-value="v => node.active = v" />
                </div>
                <q-input v-model="node.name" label="Name" dense
                  @update:model-value="v => autoSetActive(node, String(v ?? ''))" />
                <div class="text-caption text-grey-6 q-mb-xs">Effekt</div>
                <q-editor v-model="node.effect" min-height="2rem" :toolbar="editorToolbar" :definitions="editorDefinitions" />
              </q-card-section>
            </q-card>

            <!-- Experteneffekte -->
            <div class="text-subtitle2 q-mb-xs q-mt-sm" style="border-left: 3px solid #2196f3; padding-left: 8px">Experteneffekte</div>
            <q-card v-for="(node, i) in nodeTexts.experten" :key="'e'+i" flat bordered class="q-mb-xs">
              <q-card-section class="q-pa-sm q-gutter-xs">
                <div class="row items-center q-mb-xs">
                  <div class="text-caption text-grey-6 col">Experteneffekt {{ i + 1 }}</div>
                  <q-toggle :model-value="node.active" dense size="sm" color="primary" label="Aktiv"
                    @update:model-value="v => node.active = v" />
                </div>
                <q-input v-model="node.name" label="Name" dense
                  @update:model-value="v => autoSetActive(node, String(v ?? ''))" />
                <div class="text-caption text-grey-6 q-mb-xs">Effekt</div>
                <q-editor v-model="node.effect" min-height="2rem" :toolbar="editorToolbar" :definitions="editorDefinitions" />
              </q-card-section>
            </q-card>

            <!-- Meistereffekte -->
            <div class="text-subtitle2 q-mb-xs q-mt-sm" style="border-left: 3px solid #9c27b0; padding-left: 8px">Meistereffekte</div>
            <q-card v-for="(node, i) in nodeTexts.meister" :key="'m'+i" flat bordered class="q-mb-xs">
              <q-card-section class="q-pa-sm q-gutter-xs">
                <div class="row items-center q-mb-xs">
                  <div class="text-caption text-grey-6 col">Meistereffekt {{ i + 1 }}</div>
                  <q-toggle :model-value="node.active" dense size="sm" color="primary" label="Aktiv"
                    @update:model-value="v => node.active = v" />
                </div>
                <q-input v-model="node.name" label="Name" dense
                  @update:model-value="v => autoSetActive(node, String(v ?? ''))" />
                <div class="text-caption text-grey-6 q-mb-xs">Effekt</div>
                <q-editor v-model="node.effect" min-height="2rem" :toolbar="editorToolbar" :definitions="editorDefinitions" />
              </q-card-section>
            </q-card>
          </template>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" :label="editingPower ? 'Speichern' : 'Hinzufügen'" @click="savePower" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { uid, useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import { useCharacterStore } from 'src/stores/characterStore'
import { editorToolbar, editorDefinitions } from 'src/composables/useEditorConfig'
import type { AcquiredPower } from 'src/types/character'

const $q = useQuasar()
const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------
type FilterType = Exclude<AcquiredPower['type'], 'Zauber'> | 'Alle'
const filterType = ref<FilterType>('Alle')
const filterSource = ref<string | null>(null)

const typeOptions = [
  { label: 'Alle',        value: 'Alle'        },
  { label: 'Allgemein',   value: 'Allgemein'   },
  { label: 'Esprit',      value: 'Esprit'      },
  { label: 'Ausbaukraft', value: 'Ausbaukraft' },
]

const sourceOptions = computed(() => {
  if (!char.value) return []
  const sources = new Set<string>()
  char.value.acquiredPowers.forEach(p => { if (p.role) sources.add(p.role) })
  return [...sources].map(s => ({ label: s, value: s }))
})

const sourceFilterOptions = computed((): { label: string; value: string | null }[] => [
  { label: 'Alle', value: null },
  ...sourceOptions.value,
])

const filteredPowers = computed(() => {
  if (!char.value) return []
  let powers = char.value.acquiredPowers.filter(p => p.type !== 'Zauber')
  if (filterType.value !== 'Alle') powers = powers.filter(p => p.type === filterType.value)
  if (filterSource.value) powers = powers.filter(p => p.role === filterSource.value)
  return powers
})

// Rollen-Optionen: aus Status-Rollen + verwendeten Kräfte-Rollen
const roleOptions = computed(() => {
  const roles = new Set<string>()
  char.value?.roles.forEach(r => { if (r) roles.add(r) })
  char.value?.acquiredPowers.forEach(p => { if (p.role) roles.add(p.role) })
  return [...roles]
})

function typeColor(type: AcquiredPower['type']) {
  return ({ Allgemein: 'teal', Esprit: 'purple', Ausbaukraft: 'amber-9', Zauber: 'deep-orange' } as Record<string, string>)[type] ?? 'grey'
}

function activeNodes(nodes: { id: string; name: string; effect: string; active: boolean }[]) {
  return nodes.filter(n => n.active && (n.name || n.effect))
}

// ---------------------------------------------------------------------------
// Drag & Drop
// ---------------------------------------------------------------------------
function onPowersReorder(newList: AcquiredPower[]) {
  if (!char.value) return
  const groupIds = new Set(newList.map(p => p.id))
  let ni = 0
  const orderedIds = char.value.acquiredPowers.map(p =>
    groupIds.has(p.id) ? newList[ni++]!.id : p.id,
  )
  store.reorderPowers(orderedIds)
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------
interface NodeText { name: string; effect: string; active: boolean }

const showPowerDialog = ref(false)
const editingPower = ref<AcquiredPower | null>(null)
const powerForm = ref<{ name: string; type: AcquiredPower['type']; role: string; description: string }>({
  name: '', type: 'Allgemein', role: '', description: '',
})

function emptyNode(): NodeText { return { name: '', effect: '', active: false } }

function autoSetActive(node: NodeText, name: string) {
  if (name && !node.active) node.active = true
  if (!name) node.active = false
}

const nodeTexts = ref<{
  stamm: { name: string; effect: string }
  gesellen: NodeText[]
  experten: NodeText[]
  meister: NodeText[]
}>({
  stamm:    { name: '', effect: '' },
  gesellen: [emptyNode(), emptyNode(), emptyNode()],
  experten: [emptyNode(), emptyNode(), emptyNode()],
  meister:  [emptyNode(), emptyNode(), emptyNode()],
})

function resetNodeTexts() {
  nodeTexts.value = {
    stamm:    { name: '', effect: '' },
    gesellen: [emptyNode(), emptyNode(), emptyNode()],
    experten: [emptyNode(), emptyNode(), emptyNode()],
    meister:  [emptyNode(), emptyNode(), emptyNode()],
  }
}

function openAddDialog() {
  editingPower.value = null
  powerForm.value = { name: '', type: 'Allgemein', role: '', description: '' }
  resetNodeTexts()
  showPowerDialog.value = true
}

function openEditDialog(power: AcquiredPower) {
  editingPower.value = power
  powerForm.value = { name: power.name, type: power.type, role: power.role, description: power.description }
  if (power.type === 'Ausbaukraft' && power.ausbauNodes) {
    const n = power.ausbauNodes
    nodeTexts.value = {
      stamm:    { name: n.stamm.name, effect: n.stamm.effect },
      gesellen: n.gesellen.map(x => ({ name: x.name, effect: x.effect, active: x.active })),
      experten: n.experten.map(x => ({ name: x.name, effect: x.effect, active: x.active })),
      meister:  n.meister.map(x  => ({ name: x.name, effect: x.effect, active: x.active })),
    }
  } else {
    resetNodeTexts()
  }
  showPowerDialog.value = true
}

function savePower() {
  const isAusbau = powerForm.value.type === 'Ausbaukraft'
  const existing = editingPower.value

  const base = {
    name:        powerForm.value.name,
    type:        powerForm.value.type,
    role:        typeof powerForm.value.role === 'string' ? powerForm.value.role : '',
    description: powerForm.value.description,
  }
  const data: Omit<AcquiredPower, 'id'> = isAusbau ? {
    ...base,
    ausbauNodes: {
      stamm: {
        name:   nodeTexts.value.stamm.name,
        effect: nodeTexts.value.stamm.effect,
        active: true,
      },
      gesellen: nodeTexts.value.gesellen.map((nt, i) => ({
        id:     existing?.ausbauNodes?.gesellen[i]?.id ?? uid(),
        name:   nt.name,
        effect: nt.effect,
        active: nt.active,
      })),
      experten: nodeTexts.value.experten.map((nt, i) => ({
        id:     existing?.ausbauNodes?.experten[i]?.id ?? uid(),
        name:   nt.name,
        effect: nt.effect,
        active: nt.active,
      })),
      meister: nodeTexts.value.meister.map((nt, i) => ({
        id:     existing?.ausbauNodes?.meister[i]?.id ?? uid(),
        name:   nt.name,
        effect: nt.effect,
        active: nt.active,
      })),
    },
  } : base

  if (existing) store.updatePower(existing.id, data)
  else store.addPower(data)
  showPowerDialog.value = false
}
</script>
