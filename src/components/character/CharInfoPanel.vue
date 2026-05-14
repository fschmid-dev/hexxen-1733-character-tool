<template>
  <div class="q-gutter-sm q-pb-xl">
    <template v-if="char">
      <!-- Jägerinfo -->
      <div class="text-overline text-primary q-mb-xs">Jägerinfo</div>
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="q-gutter-sm">
          <div class="row q-gutter-sm">
            <q-input
              :model-value="char.name"
              label="Jägername"
              dense class="col"
              @update:model-value="v => store.updateField('name', String(v))"
            />
            <q-input
              :model-value="char.playerName"
              label="Spielername"
              dense class="col"
              @update:model-value="v => store.updateField('playerName', String(v))"
            />
          </div>
          <div class="row q-gutter-sm">
            <q-input
              :model-value="char.level"
              label="Stufe"
              type="number" dense class="col-auto" style="max-width:80px"
              @update:model-value="v => store.updateField('level', Number(v))"
            />
            <q-input
              :model-value="char.volk"
              label="Volk"
              dense class="col"
              @update:model-value="v => store.updateField('volk', String(v))"
            />
          </div>
          <div class="row q-gutter-sm">
            <q-input
              :model-value="char.profession"
              label="Profession"
              dense class="col"
              @update:model-value="v => store.updateField('profession', String(v))"
            />
            <q-input
              :model-value="char.masterProfession"
              label="Meister-Profession"
              dense class="col"
              @update:model-value="v => store.updateField('masterProfession', String(v))"
            />
          </div>
          <!-- Rollen -->
          <div class="text-caption text-grey-6 q-mt-xs">Rollen</div>
          <div class="row q-gutter-sm">
            <q-input
              v-for="(role, i) in char.roles"
              :key="i"
              :model-value="role"
              :label="`Rolle ${i + 1}`"
              dense class="col"
              @update:model-value="v => updateRole(i, String(v))"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Gefolge -->
      <div class="text-overline text-primary q-mb-xs">Gefolge</div>
      <q-card flat bordered class="q-mb-md">
        <q-list separator>
          <q-item v-for="companion in char.companions" :key="companion.id">
            <q-item-section>
              <div class="row items-center q-gutter-sm">
                <q-badge
                  :color="companion.type === 'Begleiter' ? 'teal' : 'indigo'"
                  :label="companion.type"
                />
                <q-badge outline color="grey-7" :label="`Stufe ${companion.level}`" />
                <div class="col text-body2">{{ companion.name || '–' }}</div>
              </div>
              <div v-if="companion.notes" class="text-caption text-grey-6">{{ companion.notes }}</div>
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn flat dense round icon="edit" size="xs" @click="openEditCompanion(companion)" />
                <q-btn flat dense round icon="delete_outline" size="xs" color="negative" @click="store.removeCompanion(companion.id)" />
              </div>
            </q-item-section>
          </q-item>
          <q-item v-if="char.companions.length === 0">
            <q-item-section class="text-grey-5 text-caption">Noch kein Gefolge eingetragen</q-item-section>
          </q-item>
        </q-list>
        <q-card-actions>
          <q-btn flat color="primary" icon="add" label="Gefolge hinzufügen" size="sm" @click="openAddCompanion" />
        </q-card-actions>
      </q-card>
    </template>

    <!-- Companion Dialog -->
    <q-dialog v-model="showCompanionDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">{{ editingCompanion ? 'Gefolge bearbeiten' : 'Gefolge hinzufügen' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="companionForm.name" label="Name" dense autofocus />
          <q-select
            v-model="companionForm.type"
            :options="['Begleiter','Bandenfreund']"
            label="Typ" dense
          />
          <q-btn-toggle
            v-model="companionForm.level"
            :options="[{label:'1',value:1},{label:'2',value:2},{label:'3',value:3}]"
            unelevated toggle-color="primary" size="sm"
          />
          <q-input v-model="companionForm.notes" label="Notizen" type="textarea" rows="2" dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" :label="editingCompanion ? 'Speichern' : 'Hinzufügen'" @click="saveCompanion" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from 'src/stores/characterStore'
import type { Companion } from 'src/types/character'

const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

function updateRole(index: number, value: string) {
  if (!char.value) return
  const roles = [...char.value.roles] as [string, string, string]
  roles[index] = value
  store.updateField('roles', roles)
}

// Companion Dialog
const showCompanionDialog = ref(false)
const editingCompanion = ref<Companion | null>(null)
const companionForm = ref<Omit<Companion, 'id'>>({ name: '', type: 'Begleiter', level: 1, notes: '' })

function openAddCompanion() {
  editingCompanion.value = null
  companionForm.value = { name: '', type: 'Begleiter', level: 1, notes: '' }
  showCompanionDialog.value = true
}

function openEditCompanion(companion: Companion) {
  editingCompanion.value = companion
  companionForm.value = { name: companion.name, type: companion.type, level: companion.level, notes: companion.notes }
  showCompanionDialog.value = true
}

function saveCompanion() {
  if (editingCompanion.value) {
    store.updateCompanion(editingCompanion.value.id, companionForm.value)
  } else {
    store.addCompanion(companionForm.value)
  }
  showCompanionDialog.value = false
}
</script>
