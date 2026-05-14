<template>
  <div class="q-gutter-sm q-pb-xl">
    <template v-if="char">
      <div class="text-overline text-primary q-mb-xs">Allgemeine Fertigkeiten</div>

      <!-- Eine Card, zwei Spalten auf Desktop, eine auf Mobile -->
      <q-card flat bordered>
        <div class="row wrap skills-grid">
          <div
            v-for="skill in char.skills.general"
            :key="skill.id"
            class="col-12 col-sm-6"
          >
            <SkillRow
              :skill="skill"
              :total="store.skillTotal(skill.id)"
              :attr-value="char.attributes[skill.baseAttribute]"
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
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Manueller Bonus</div></q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model.number="bonusForm.value" label="Bonuswert" type="number" dense />
          <q-input v-model="bonusForm.badgeText" label="Badge-Text (z.B. +2 | Aristokrat)" dense />
          <q-input v-model="bonusForm.description" label="Beschreibung" type="textarea" rows="3" dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Entfernen" color="negative" @click="clearBonus" />
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" label="Speichern" @click="saveBonus" />
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
import { useCharacterStore } from 'src/stores/characterStore'
import type { AttributeKey, ManualBonus } from 'src/types/character'
import SkillRow from 'src/components/SkillRow.vue'

const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

// Bonus-Dialog
const showBonusDialog = ref(false)
const activeBonusSkillId = ref('')
const bonusForm = ref<ManualBonus>({ value: 0, badgeText: '', description: '' })

function openBonusDialog(skillId: string) {
  activeBonusSkillId.value = skillId
  const skill = char.value?.skills.general.find(s => s.id === skillId)
  bonusForm.value = skill?.manualBonus
    ? { ...skill.manualBonus }
    : { value: 0, badgeText: '', description: '' }
  showBonusDialog.value = true
}

function saveBonus() {
  store.setSkillBonus(activeBonusSkillId.value, bonusForm.value.badgeText ? { ...bonusForm.value } : undefined)
  showBonusDialog.value = false
}

function clearBonus() {
  store.setSkillBonus(activeBonusSkillId.value, undefined)
  showBonusDialog.value = false
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
