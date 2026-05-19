<template>
  <div class="q-gutter-sm q-pb-xl">
    <template v-if="char">
      <!-- Header: Titel + View-Toggles (nur auf größeren Screens) -->
      <div class="row items-center q-mb-xs">
        <div class="text-overline text-primary col">Allgemeine Fertigkeiten</div>
        <div v-if="$q.screen.gt.xs" class="row q-gutter-xs">
          <q-btn
            v-for="opt in viewOptions" :key="opt.value"
            :icon="opt.icon" :title="opt.label" flat dense round size="sm"
            :color="viewMode === opt.value ? 'primary' : 'grey-6'"
            @click="viewMode = opt.value"
          />
        </div>
      </div>

      <q-card flat bordered>
        <!-- Spalten-Modus (viewMode = 'cols'): erste Hälfte links, zweite Hälfte rechts -->
        <div v-if="viewMode === 'cols'" class="row">
          <div class="col-6">
            <div v-for="skill in columnLeft" :key="skill.id" style="border-bottom: 1px solid rgba(0,0,0,0.12)">
              <SkillRow
                :skill="skill" :total="store.skillTotal(skill.id)" :attr-value="char.attributes[skill.baseAttribute]"
                @update-value="v => store.updateSkillValue(skill.id, v)"
                @open-dialog="openBonusDialog(skill.id)"
                @remove="store.removeCustomSkill(skill.id)"
              />
            </div>
          </div>
          <div class="col-6" style="border-left: 1px solid rgba(0,0,0,0.12)">
            <div v-for="skill in columnRight" :key="skill.id" style="border-bottom: 1px solid rgba(0,0,0,0.12)">
              <SkillRow
                :skill="skill" :total="store.skillTotal(skill.id)" :attr-value="char.attributes[skill.baseAttribute]"
                @update-value="v => store.updateSkillValue(skill.id, v)"
                @open-dialog="openBonusDialog(skill.id)"
                @remove="store.removeCustomSkill(skill.id)"
              />
            </div>
          </div>
        </div>

        <!-- Zeilen-Modus (viewMode = 'rows', default): 2-spaltig, alphabetisch in Zeilen -->
        <div v-else-if="viewMode === 'rows'" class="row wrap skills-grid">
          <div
            v-for="skill in sortedSkills" :key="skill.id"
            class="col-12 col-sm-6"
          >
            <SkillRow
              :skill="skill" :total="store.skillTotal(skill.id)" :attr-value="char.attributes[skill.baseAttribute]"
              @update-value="v => store.updateSkillValue(skill.id, v)"
              @open-dialog="openBonusDialog(skill.id)"
              @remove="store.removeCustomSkill(skill.id)"
            />
          </div>
        </div>

        <!-- Einzel-Spalte (viewMode = 'single') -->
        <div v-else>
          <div v-for="skill in sortedSkills" :key="skill.id" style="border-bottom: 1px solid rgba(0,0,0,0.12)">
            <SkillRow
              :skill="skill" :total="store.skillTotal(skill.id)" :attr-value="char.attributes[skill.baseAttribute]"
              @update-value="v => store.updateSkillValue(skill.id, v)"
              @open-dialog="openBonusDialog(skill.id)"
              @remove="store.removeCustomSkill(skill.id)"
            />
          </div>
        </div>
      </q-card>

      <q-btn
        flat color="primary" icon="add" label="Eigene Fertigkeit hinzufügen"
        size="sm" class="q-mt-xs" @click="showAddSkillDialog = true"
      />
    </template>

    <!-- Bonus-Dialog -->
    <q-dialog v-model="showBonusDialog">
      <q-card style="min-width: 340px; max-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Manuelle Boni</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <!-- Bestehende Boni -->
          <div v-for="bonus in activeBonusList" :key="bonus.id" class="q-mb-sm">
            <q-card flat bordered class="q-pa-xs">
              <div class="row items-center q-gutter-xs">
                <q-toggle :model-value="bonus.active" dense color="primary" size="sm"
                  @update:model-value="store.toggleSkillBonus(activeBonusSkillId, bonus.id)" />
                <div class="col">
                  <div class="text-body2 text-weight-medium">{{ bonus.badgeText || '(kein Label)' }}</div>
                  <div class="text-caption text-grey-5">{{ bonus.value > 0 ? '+' : '' }}{{ bonus.value }}</div>
                </div>
                <q-btn flat dense round icon="edit" size="xs"
                  @click="startEditBonus(bonus)" />
                <q-btn flat dense round icon="delete_outline" size="xs" color="negative"
                  @click="store.removeSkillBonus(activeBonusSkillId, bonus.id)" />
              </div>
            </q-card>
          </div>

          <!-- Neuen Bonus hinzufügen oder bearbeiten -->
          <q-separator v-if="activeBonusList.length > 0" class="q-my-sm" />
          <div class="text-caption text-grey-6 q-mb-xs">{{ editingBonusId ? 'Bonus bearbeiten' : 'Bonus hinzufügen' }}</div>
          <div class="q-gutter-xs">
            <q-input v-model.number="bonusForm.value" label="Bonuswert" type="number" dense />
            <q-input v-model="bonusForm.badgeText" label="Label (z.B. Aristokrat +2)" dense />
            <div class="text-caption text-grey-6 q-mb-xs">Beschreibung</div>
            <q-editor v-model="bonusForm.description" min-height="3rem" :toolbar="editorToolbar" :definitions="editorDefinitions" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-if="editingBonusId" flat label="Abbrechen" @click="cancelEditBonus" />
          <q-btn flat label="Schließen" v-close-popup />
          <q-btn color="primary" :label="editingBonusId ? 'Speichern' : 'Hinzufügen'" @click="saveBonus" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Neue Fertigkeit Dialog -->
    <q-dialog v-model="showAddSkillDialog">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Eigene Fertigkeit</div></q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="newSkillForm.name" label="Name" dense autofocus />
          <q-select
            v-model="newSkillForm.baseAttribute"
            :options="attrOptions"
            option-value="value" option-label="label"
            emit-value map-options
            label="Basisattribut" dense
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" label="Hinzufügen"
            :disable="!newSkillForm.name.trim()"
            @click="addCustomSkill"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useCharacterStore } from 'src/stores/characterStore'
import type { AttributeKey } from 'src/types/character'
import { editorToolbar, editorDefinitions } from 'src/composables/useEditorConfig'
import SkillRow from 'src/components/SkillRow.vue'

const $q = useQuasar()
const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

// View-Modus
type ViewMode = 'rows' | 'cols' | 'single'
const viewMode = ref<ViewMode>('rows')
const viewOptions = [
  { value: 'rows'   as ViewMode, icon: 'view_module',  label: 'Nach Zeilen (Standard)' },
  { value: 'cols'   as ViewMode, icon: 'view_column',  label: 'Nach Spalten'           },
  { value: 'single' as ViewMode, icon: 'view_agenda',  label: 'Eine Spalte'            },
]

// Alphabetisch sortierte Skills (custom inline eingereiht)
const sortedSkills = computed(() =>
  [...(char.value?.skills.general ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, 'de'),
  ),
)

// Spalten-Modus: erste Hälfte / zweite Hälfte
const columnLeft = computed(() => {
  const half = Math.ceil(sortedSkills.value.length / 2)
  return sortedSkills.value.slice(0, half)
})
const columnRight = computed(() => {
  const half = Math.ceil(sortedSkills.value.length / 2)
  return sortedSkills.value.slice(half)
})

// Bonus-Dialog
const showBonusDialog = ref(false)
const activeBonusSkillId = ref('')
const editingBonusId = ref('')
const bonusForm = ref({ value: 0, badgeText: '', description: '' })

const activeBonusList = computed(() => {
  const skill = char.value?.skills.general.find(s => s.id === activeBonusSkillId.value)
  return skill?.manualBonuses ?? []
})

function openBonusDialog(skillId: string) {
  activeBonusSkillId.value = skillId
  editingBonusId.value = ''
  bonusForm.value = { value: 0, badgeText: '', description: '' }
  showBonusDialog.value = true
}

function startEditBonus(bonus: { id: string; value: number; badgeText: string; description: string }) {
  editingBonusId.value = bonus.id
  bonusForm.value = { value: bonus.value, badgeText: bonus.badgeText, description: bonus.description }
}

function cancelEditBonus() {
  editingBonusId.value = ''
  bonusForm.value = { value: 0, badgeText: '', description: '' }
}

function saveBonus() {
  if (editingBonusId.value) {
    store.updateSkillBonus(activeBonusSkillId.value, editingBonusId.value, { ...bonusForm.value })
    cancelEditBonus()
  } else {
    store.addSkillBonus(activeBonusSkillId.value, { ...bonusForm.value, active: true })
    bonusForm.value = { value: 0, badgeText: '', description: '' }
  }
}

// Neue Fertigkeit
const showAddSkillDialog = ref(false)
const newSkillForm = ref<{ name: string; baseAttribute: AttributeKey }>({ name: '', baseAttribute: 'kkr' })

const attrOptions: { label: string; value: AttributeKey }[] = [
  { label: 'KKR – Körperkraft',   value: 'kkr' },
  { label: 'ATH – Athletik',      value: 'ath' },
  { label: 'GES – Geschick',      value: 'ges' },
  { label: 'SIN – Sinnesschärfe', value: 'sin' },
  { label: 'WIS – Wissen',        value: 'wis' },
  { label: 'WIL – Willenskraft',  value: 'wil' },
]

function addCustomSkill() {
  if (!newSkillForm.value.name.trim()) return
  store.addCustomSkill({ name: newSkillForm.value.name, baseAttribute: newSkillForm.value.baseAttribute, value: 0 })
  newSkillForm.value = { name: '', baseAttribute: 'kkr' }
  showAddSkillDialog.value = false
}
</script>
