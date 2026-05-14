<template>
  <div v-if="char" class="q-gutter-sm q-pb-xl">

    <!-- Kampffertigkeiten -->
    <div class="text-overline text-primary">Kampffertigkeiten</div>
    <q-card flat bordered>
      <q-list separator>
        <q-item v-for="skill in char.skills.fighting" :key="skill.id">
          <q-item-section>
            <!-- Zeile 1: Name + Attribut + Bonus-Badge -->
            <div class="row no-wrap items-center q-gutter-xs q-mb-xs">
              <div class="col text-body2 text-weight-medium" style="min-width:0">{{ skill.name }}</div>
              <q-badge :color="['kkr','ath','ges'].includes(skill.baseAttribute) ? 'deep-orange-7' : 'green-7'" :label="skill.baseAttribute.toUpperCase()" />
              <q-badge v-if="skill.manualBonus?.badgeText" color="amber-9" :label="skill.manualBonus.badgeText" />
            </div>
            <!-- Zeile 2: Kampfwerte + FW-Stepper + Summe -->
            <div class="row items-center q-gutter-xs">
              <span class="text-caption text-grey-5">Sch&nbsp;{{ skill.baseDamage }}</span>
              <span class="text-caption text-grey-4">·</span>
              <span class="text-caption text-grey-5">AP&nbsp;{{ skill.apCost }}</span>
              <span class="text-caption text-grey-4">·</span>
              <span class="text-caption text-grey-5">{{ skill.parryModifier }}</span>
              <q-space />
              <span class="text-caption text-grey-5">FW</span>
              <q-btn flat dense round icon="remove" size="xs"
                @click="store.updateSkillValue(skill.id, skill.value - 1)" />
              <span class="text-subtitle2 text-weight-bold" style="min-width:18px;text-align:center">
                {{ skill.value }}
              </span>
              <q-btn flat dense round icon="add" size="xs"
                @click="store.updateSkillValue(skill.id, skill.value + 1)" />
              <span class="text-caption text-grey-5">=</span>
              <span class="text-subtitle2 text-weight-bold text-primary">
                {{ skill.value + char.attributes[skill.baseAttribute] }}
              </span>
              <span
                v-if="skill.manualBonus?.value"
                class="text-caption text-amber-9"
                style="min-width:24px"
              >
                {{ skill.manualBonus.value > 0 ? '+' : '' }}{{ skill.manualBonus.value }}
              </span>
              <q-btn flat dense round icon="info_outline" size="xs" color="grey-6"
                @click="openBonusDialog(skill.id)" />
            </div>
            <div v-if="skill.notes" class="text-caption text-grey-5 q-mt-xs">{{ skill.notes }}</div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Eigene Waffen -->
    <div class="text-overline text-primary">Eigene Waffen</div>
    <q-card flat bordered>
      <q-list separator>
        <q-item v-for="weapon in char.weapons" :key="weapon.id">
          <q-item-section avatar>
            <q-toggle :model-value="weapon.isActive" color="primary" dense
              @update:model-value="v => store.updateWeapon(weapon.id, { isActive: v })" />
          </q-item-section>
          <q-item-section>
            <q-item-label :class="weapon.isActive ? 'text-weight-bold' : 'text-grey-6'">
              {{ weapon.name }}
            </q-item-label>
            <q-item-label caption>
              Schaden: {{ weapon.baseDamage }} · AP: {{ weapon.apCost }} · Parade: {{ weapon.parryModifier }}
            </q-item-label>
            <q-item-label v-if="weapon.notes" caption><span v-html="weapon.notes" /></q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn flat dense round icon="edit" size="xs" @click="openEditWeapon(weapon)" />
              <q-btn flat dense round icon="delete_outline" size="xs" color="negative"
                @click="store.removeWeapon(weapon.id)" />
            </div>
          </q-item-section>
        </q-item>
        <q-item v-if="char.weapons.length === 0">
          <q-item-section class="text-grey-5 text-caption">Noch keine eigenen Waffen</q-item-section>
        </q-item>
      </q-list>
      <q-card-actions>
        <q-btn flat color="primary" icon="add" label="Waffe hinzufügen" size="sm" @click="openAddWeapon" />
      </q-card-actions>
    </q-card>

    <!-- Bonus-Dialog -->
    <q-dialog v-model="showBonusDialog">
      <q-card style="min-width:300px">
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

    <!-- Waffe Dialog -->
    <q-dialog v-model="showWeaponDialog">
      <q-card style="min-width:300px">
        <q-card-section><div class="text-h6">Waffe</div></q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="weaponForm.name" label="Name" dense autofocus />
          <div class="row q-gutter-sm">
            <q-input v-model.number="weaponForm.baseDamage" label="Schaden" type="number" dense class="col" />
            <q-input v-model.number="weaponForm.apCost" label="AP" type="number" dense class="col" />
            <q-input v-model="weaponForm.parryModifier" label="Parade" dense class="col" />
          </div>
          <div class="text-caption text-grey-6 q-mb-xs">Anmerkungen</div>
          <q-editor v-model="weaponForm.notes" min-height="3rem" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" :label="editingWeapon ? 'Speichern' : 'Hinzufügen'" @click="saveWeapon" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from 'src/stores/characterStore'
import type { Weapon, ManualBonus } from 'src/types/character'

const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

// Bonus Dialog
const showBonusDialog = ref(false)
const activeBonusId = ref('')
const bonusForm = ref<ManualBonus>({ value: 0, badgeText: '', description: '' })

function openBonusDialog(skillId: string) {
  activeBonusId.value = skillId
  const skill = char.value?.skills.fighting.find(s => s.id === skillId)
  bonusForm.value = skill?.manualBonus ? { ...skill.manualBonus } : { value: 0, badgeText: '', description: '' }
  showBonusDialog.value = true
}
function saveBonus() {
  store.setSkillBonus(activeBonusId.value, bonusForm.value.badgeText ? { ...bonusForm.value } : undefined)
  showBonusDialog.value = false
}
function clearBonus() {
  store.setSkillBonus(activeBonusId.value, undefined)
  showBonusDialog.value = false
}

// Waffe Dialog
const showWeaponDialog = ref(false)
const editingWeapon = ref<Weapon | null>(null)
const weaponForm = ref<Omit<Weapon, 'id'>>({ name: '', baseDamage: 0, apCost: 1, parryModifier: '+/-0', notes: '', isActive: true })

function openAddWeapon() {
  editingWeapon.value = null
  weaponForm.value = { name: '', baseDamage: 0, apCost: 1, parryModifier: '+/-0', notes: '', isActive: true }
  showWeaponDialog.value = true
}
function openEditWeapon(w: Weapon) {
  editingWeapon.value = w
  weaponForm.value = { ...w }
  showWeaponDialog.value = true
}
function saveWeapon() {
  if (editingWeapon.value) store.updateWeapon(editingWeapon.value.id, weaponForm.value)
  else store.addWeapon(weaponForm.value)
  showWeaponDialog.value = false
}
</script>
