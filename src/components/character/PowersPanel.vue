<template>
  <div class="q-gutter-sm q-pb-xl">
    <template v-if="char">

      <!-- Filter + Hinzufügen -->
      <div class="row q-gutter-xs q-mb-sm items-center">
        <q-btn-toggle
          v-model="filterType"
          :options="typeOptions"
          unelevated dense size="sm"
          toggle-color="primary"
          color="grey-2"
          text-color="grey-8"
          class="q-px-xs"
        />
        <q-space />
        <q-btn color="primary" icon="add" label="Kraft hinzufügen" size="sm" unelevated @click="openAddDialog" />
      </div>

      <!-- Kräfte-Liste -->
      <div class="q-gutter-sm">
        <q-card v-for="power in filteredPowers" :key="power.id" flat bordered>
          <q-card-section class="q-pa-sm">
            <div class="row items-center q-gutter-xs q-mb-xs">
              <div class="text-subtitle2 text-weight-bold col">{{ power.name }}</div>
              <q-badge :color="typeColor(power.type)" :label="power.type" />
              <q-badge v-if="power.role" color="grey-6" :label="power.role" />
              <q-btn flat dense round icon="edit" size="xs" @click="openEditDialog(power)" />
              <q-btn flat dense round icon="delete_outline" size="xs" color="negative" @click="store.removePower(power.id)" />
            </div>

            <div v-if="power.description" class="text-body2 text-grey-8 q-mb-sm" v-html="power.description" />

            <!-- Ausbaukraft-Nodes -->
            <template v-if="power.type === 'Ausbaukraft' && power.ausbauNodes">
              <q-separator class="q-mb-sm" />
              <div class="power-node power-node--stamm q-pl-sm q-mb-xs">
                <div class="row items-start q-gutter-xs">
                  <q-badge color="amber-9" label="S" class="q-mt-xs" />
                  <div class="col">
                    <div class="text-body2 text-weight-medium">{{ power.ausbauNodes.stamm.name || 'Stammeffekt' }}</div>
                    <div v-if="power.ausbauNodes.stamm.effect" class="text-caption text-grey-6">{{ power.ausbauNodes.stamm.effect }}</div>
                  </div>
                  <q-toggle :model-value="power.ausbauNodes.stamm.active" dense size="sm" color="primary"
                    @update:model-value="v => toggleStamm(power.id, v)" />
                </div>
              </div>
              <div v-for="node in power.ausbauNodes.gesellen" :key="node.id"
                class="power-node power-node--geselle q-pl-sm q-mb-xs">
                <div class="row items-start q-gutter-xs">
                  <q-badge color="green-8" label="G" class="q-mt-xs" />
                  <div class="col">
                    <div class="text-body2 text-weight-medium">{{ node.name || 'Geselleneffekt' }}</div>
                    <div v-if="node.effect" class="text-caption text-grey-6">{{ node.effect }}</div>
                  </div>
                  <q-toggle :model-value="node.active" dense size="sm" color="primary"
                    @update:model-value="() => store.toggleAusbauNode(power.id, 'gesellen', node.id)" />
                </div>
              </div>
              <div v-for="node in power.ausbauNodes.experten" :key="node.id"
                class="power-node power-node--experte q-pl-sm q-mb-xs">
                <div class="row items-start q-gutter-xs">
                  <q-badge color="blue-8" label="E" class="q-mt-xs" />
                  <div class="col">
                    <div class="text-body2 text-weight-medium">{{ node.name || 'Experteneffekt' }}</div>
                    <div v-if="node.effect" class="text-caption text-grey-6">{{ node.effect }}</div>
                  </div>
                  <q-toggle :model-value="node.active" dense size="sm" color="primary"
                    @update:model-value="() => store.toggleAusbauNode(power.id, 'experten', node.id)" />
                </div>
              </div>
              <div v-for="node in power.ausbauNodes.meister" :key="node.id"
                class="power-node power-node--meister q-pl-sm q-mb-xs">
                <div class="row items-start q-gutter-xs">
                  <q-badge color="purple-8" label="M" class="q-mt-xs" />
                  <div class="col">
                    <div class="text-body2 text-weight-medium">{{ node.name || 'Meistereffekt' }}</div>
                    <div v-if="node.effect" class="text-caption text-grey-6">{{ node.effect }}</div>
                  </div>
                  <q-toggle :model-value="node.active" dense size="sm" color="primary"
                    @update:model-value="() => store.toggleAusbauNode(power.id, 'meister', node.id)" />
                </div>
              </div>
            </template>
          </q-card-section>
        </q-card>
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
          <q-select v-model="powerForm.type" :options="['Allgemein','Esprit','Ausbaukraft']" label="Typ" dense />
          <q-input v-model="powerForm.role" label="Rolle (optional)" dense />
          <div class="text-caption text-grey-6 q-mb-xs">Beschreibung</div>
          <q-editor v-model="powerForm.description" min-height="5rem" />

          <!-- Ausbaukraft-Stufen -->
          <template v-if="powerForm.type === 'Ausbaukraft'">
            <q-separator class="q-my-sm" />
            <div class="text-subtitle2 q-mb-xs">Stammeffekt</div>
            <q-card flat bordered class="q-mb-sm">
              <q-card-section class="q-pa-sm q-gutter-xs">
                <q-input v-model="nodeTexts.stamm.name" label="Name" dense />
                <q-input v-model="nodeTexts.stamm.effect" label="Effekt" dense type="textarea" rows="2" />
              </q-card-section>
            </q-card>

            <div v-for="(tier, tierKey) in tierConfig" :key="tierKey">
              <div class="text-subtitle2 q-mb-xs q-mt-sm">{{ tier.label }}</div>
              <q-card v-for="(node, i) in nodeTexts[tierKey]" :key="tierKey+i" flat bordered class="q-mb-xs">
                <q-card-section class="q-pa-sm q-gutter-xs">
                  <div class="text-caption text-grey-6">{{ tier.label.slice(0,-1) }} {{ i + 1 }}</div>
                  <q-input v-model="node.name" label="Name" dense />
                  <q-input v-model="node.effect" label="Effekt" dense type="textarea" rows="2" />
                </q-card-section>
              </q-card>
            </div>
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
import { uid } from 'quasar'
import { useCharacterStore } from 'src/stores/characterStore'
import type { AcquiredPower } from 'src/types/character'

const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

type FilterType = Exclude<AcquiredPower['type'], 'Zauber'> | 'Alle'
const filterType = ref<FilterType>('Alle')
const typeOptions = [
  { label: 'Alle',        value: 'Alle'        },
  { label: 'Allgemein',   value: 'Allgemein'   },
  { label: 'Esprit',      value: 'Esprit'      },
  { label: 'Ausbaukraft', value: 'Ausbaukraft' },
]

const tierConfig = {
  gesellen: { label: 'Geselleneffekte' },
  experten: { label: 'Experteneffekte' },
  meister:  { label: 'Meistereffekte'  },
} as const

const filteredPowers = computed(() => {
  if (!char.value) return []
  const powers = char.value.acquiredPowers.filter(p => p.type !== 'Zauber')
  if (filterType.value === 'Alle') return powers
  return powers.filter(p => p.type === filterType.value)
})

function typeColor(type: AcquiredPower['type']) {
  return ({ Allgemein: 'teal', Esprit: 'purple', Ausbaukraft: 'amber-9', Zauber: 'deep-orange' } as Record<string, string>)[type] ?? 'grey'
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------
interface NodeText { name: string; effect: string }

const showPowerDialog = ref(false)
const editingPower = ref<AcquiredPower | null>(null)
const powerForm = ref<{ name: string; type: AcquiredPower['type']; role: string; description: string }>({ name: '', type: 'Allgemein', role: '', description: '' })

function emptyNode(): NodeText { return { name: '', effect: '' } }

const nodeTexts = ref<{
  stamm: NodeText
  gesellen: NodeText[]
  experten: NodeText[]
  meister: NodeText[]
}>({
  stamm:    emptyNode(),
  gesellen: [emptyNode(), emptyNode(), emptyNode()],
  experten: [emptyNode(), emptyNode(), emptyNode()],
  meister:  [emptyNode(), emptyNode(), emptyNode()],
})

function resetNodeTexts() {
  nodeTexts.value = {
    stamm:    emptyNode(),
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
      stamm:    { name: n.stamm.name,    effect: n.stamm.effect    },
      gesellen: n.gesellen.map(x => ({ name: x.name, effect: x.effect })),
      experten: n.experten.map(x => ({ name: x.name, effect: x.effect })),
      meister:  n.meister.map(x  => ({ name: x.name, effect: x.effect })),
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
    role:        powerForm.value.role,
    description: powerForm.value.description,
  }
  const data: Omit<AcquiredPower, 'id'> = isAusbau ? {
    ...base,
    ausbauNodes: {
      stamm: {
        name:   nodeTexts.value.stamm.name,
        effect: nodeTexts.value.stamm.effect,
        active: existing?.ausbauNodes?.stamm.active ?? false,
      },
      gesellen: nodeTexts.value.gesellen.map((nt, i) => ({
        id:     existing?.ausbauNodes?.gesellen[i]?.id ?? uid(),
        name:   nt.name,
        effect: nt.effect,
        active: existing?.ausbauNodes?.gesellen[i]?.active ?? false,
      })),
      experten: nodeTexts.value.experten.map((nt, i) => ({
        id:     existing?.ausbauNodes?.experten[i]?.id ?? uid(),
        name:   nt.name,
        effect: nt.effect,
        active: existing?.ausbauNodes?.experten[i]?.active ?? false,
      })),
      meister: nodeTexts.value.meister.map((nt, i) => ({
        id:     existing?.ausbauNodes?.meister[i]?.id ?? uid(),
        name:   nt.name,
        effect: nt.effect,
        active: existing?.ausbauNodes?.meister[i]?.active ?? false,
      })),
    },
  } : base

  if (existing) store.updatePower(existing.id, data)
  else store.addPower(data)
  showPowerDialog.value = false
}

function toggleStamm(powerId: string, active: boolean) {
  const p = char.value?.acquiredPowers.find(x => x.id === powerId)
  if (p?.ausbauNodes) {
    store.updatePower(powerId, {
      ausbauNodes: { ...p.ausbauNodes, stamm: { ...p.ausbauNodes.stamm, active } },
    })
  }
}
</script>
