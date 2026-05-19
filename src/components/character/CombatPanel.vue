<template>
  <div v-if="char" class="q-gutter-sm q-pb-xl">

    <!-- Eigene Waffen -->
    <div class="text-overline text-primary">Eigene Waffen</div>
    <q-card flat bordered>
      <draggable
        :model-value="char.weapons"
        item-key="id"
        handle=".drag-handle"
        @update:model-value="onWeaponsReorder"
      >
        <template #item="{ element: weapon }">
          <q-item>
            <q-item-section avatar class="drag-handle cursor-grab" style="min-width:24px">
              <q-icon name="drag_indicator" color="grey-5" size="sm" />
            </q-item-section>
            <q-item-section avatar>
              <q-toggle :model-value="weapon.isActive" color="primary" dense
                @update:model-value="v => store.updateWeapon(weapon.id, { isActive: v })" />
            </q-item-section>
            <q-item-section>
              <q-item-label :class="weapon.isActive ? 'text-weight-bold' : 'text-grey-6'">
                {{ weapon.name }}
                <q-badge v-if="weapon.skillId" color="grey-6" class="q-ml-xs" size="xs"
                  :label="linkedSkillName(weapon.skillId)" />
                <template v-for="bonus in (weapon.manualBonuses ?? []).filter(b => b.active)" :key="bonus.id">
                  <q-badge v-if="bonus.badgeText" color="amber-9" class="q-ml-xs" size="xs" :label="bonus.badgeText" />
                </template>
              </q-item-label>
              <q-item-label caption>
                Sch: {{ weapon.baseDamage }} · AP: {{ weapon.apCost }} · Parade: {{ weapon.parryModifier }}
              </q-item-label>
              <q-item-label v-if="weapon.skillId" caption class="text-primary">
                {{ linkedSkillSummary(weapon.skillId, weapon.manualBonuses) }}
              </q-item-label>
              <q-item-label v-if="weapon.notes" caption><span v-html="weapon.notes" /></q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn flat dense round icon="stars" size="xs" @click="openWeaponBonusDialog(weapon.id)" />
                <q-btn flat dense round icon="edit" size="xs" @click="openEditWeapon(weapon)" />
                <q-btn flat dense round icon="delete_outline" size="xs" color="negative"
                  @click="store.removeWeapon(weapon.id)" />
              </div>
            </q-item-section>
          </q-item>
        </template>
      </draggable>
      <q-item v-if="char.weapons.length === 0">
        <q-item-section class="text-grey-5 text-caption">Noch keine eigenen Waffen</q-item-section>
      </q-item>
      <q-card-actions>
        <q-btn flat color="primary" icon="add" label="Waffe hinzufügen" size="sm" @click="openAddWeapon" />
      </q-card-actions>
    </q-card>

    <!-- Kampffertigkeiten -->
    <div class="text-overline text-primary">Kampffertigkeiten</div>
    <q-card flat bordered>
      <draggable
        :model-value="char.skills.fighting"
        item-key="id"
        handle=".drag-handle"
        @update:model-value="onFightingSkillsReorder"
      >
        <template #item="{ element: skill }">
          <q-item style="border-bottom: 1px solid rgba(0,0,0,0.08)">
            <q-item-section avatar class="drag-handle cursor-grab" style="min-width:24px">
              <q-icon name="drag_indicator" color="grey-5" size="sm" />
            </q-item-section>
            <q-item-section>
              <!-- Zeile 1: Name + Attribut + Bonus-Badges -->
              <div class="row no-wrap items-center q-gutter-xs q-mb-xs">
                <div class="col text-body2 text-weight-medium" style="min-width:0">{{ skill.name }}</div>
                <q-badge :color="['kkr','ath','ges'].includes(skill.baseAttribute) ? 'deep-orange-7' : 'green-7'" :label="skill.baseAttribute.toUpperCase()" />
                <template v-for="bonus in (skill.manualBonuses ?? []).filter(b => b.active)" :key="bonus.id">
                  <q-badge v-if="bonus.badgeText" color="amber-9" :label="bonus.badgeText" />
                </template>
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
                  v-if="activeBonusSum(skill.manualBonuses) !== 0"
                  class="text-caption text-amber-9"
                  style="min-width:24px"
                >
                  {{ activeBonusSum(skill.manualBonuses) > 0 ? '+' : '' }}{{ activeBonusSum(skill.manualBonuses) }}
                </span>
                <q-btn flat dense round icon="info_outline" size="xs" color="grey-6"
                  @click="openBonusDialog(skill.id)" />
              </div>
              <div v-if="skill.notes" class="text-caption text-grey-5 q-mt-xs">{{ skill.notes }}</div>
            </q-item-section>
          </q-item>
        </template>
      </draggable>
    </q-card>

    <!-- Bonus-Dialog (Kampffertigkeiten) -->
    <q-dialog v-model="showBonusDialog">
      <q-card style="min-width: 340px; max-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Manuelle Boni</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <div v-for="bonus in activeBonusList" :key="bonus.id" class="q-mb-sm">
            <q-card flat bordered class="q-pa-xs">
              <div class="row items-center q-gutter-xs">
                <q-toggle :model-value="bonus.active" dense color="primary" size="sm"
                  @update:model-value="store.toggleSkillBonus(activeBonusId, bonus.id)" />
                <div class="col">
                  <div class="text-body2 text-weight-medium">{{ bonus.badgeText || '(kein Label)' }}</div>
                  <div class="text-caption text-grey-5">{{ bonus.value > 0 ? '+' : '' }}{{ bonus.value }}</div>
                </div>
                <q-btn flat dense round icon="edit" size="xs" @click="startEditBonus(bonus)" />
                <q-btn flat dense round icon="delete_outline" size="xs" color="negative"
                  @click="store.removeSkillBonus(activeBonusId, bonus.id)" />
              </div>
            </q-card>
          </div>
          <q-separator v-if="activeBonusList.length > 0" class="q-my-sm" />
          <div class="text-caption text-grey-6 q-mb-xs">{{ editingBonusId ? 'Bonus bearbeiten' : 'Bonus hinzufügen' }}</div>
          <div class="q-gutter-xs">
            <q-input v-model.number="bonusForm.value" label="Bonuswert" type="number" dense />
            <q-input v-model="bonusForm.badgeText" label="Label" dense />
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

    <!-- Bonus-Dialog (Eigene Waffen) -->
    <q-dialog v-model="showWeaponBonusDialog">
      <q-card style="min-width: 340px; max-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Waffen-Boni</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <div v-for="bonus in activeWeaponBonusList" :key="bonus.id" class="q-mb-sm">
            <q-card flat bordered class="q-pa-xs">
              <div class="row items-center q-gutter-xs">
                <q-toggle :model-value="bonus.active" dense color="primary" size="sm"
                  @update:model-value="store.toggleWeaponBonus(activeWeaponBonusId, bonus.id)" />
                <div class="col">
                  <div class="text-body2 text-weight-medium">{{ bonus.badgeText || '(kein Label)' }}</div>
                  <div class="text-caption text-grey-5">{{ bonus.value > 0 ? '+' : '' }}{{ bonus.value }}</div>
                </div>
                <q-btn flat dense round icon="edit" size="xs" @click="startEditWeaponBonus(bonus)" />
                <q-btn flat dense round icon="delete_outline" size="xs" color="negative"
                  @click="store.removeWeaponBonus(activeWeaponBonusId, bonus.id)" />
              </div>
            </q-card>
          </div>
          <q-separator v-if="activeWeaponBonusList.length > 0" class="q-my-sm" />
          <div class="text-caption text-grey-6 q-mb-xs">{{ editingWeaponBonusId ? 'Bonus bearbeiten' : 'Bonus hinzufügen' }}</div>
          <div class="q-gutter-xs">
            <q-input v-model.number="weaponBonusForm.value" label="Bonuswert" type="number" dense />
            <q-input v-model="weaponBonusForm.badgeText" label="Label" dense />
            <div class="text-caption text-grey-6 q-mb-xs">Beschreibung</div>
            <q-editor v-model="weaponBonusForm.description" min-height="3rem" :toolbar="editorToolbar" :definitions="editorDefinitions" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-if="editingWeaponBonusId" flat label="Abbrechen" @click="cancelEditWeaponBonus" />
          <q-btn flat label="Schließen" v-close-popup />
          <q-btn color="primary" :label="editingWeaponBonusId ? 'Speichern' : 'Hinzufügen'" @click="saveWeaponBonus" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Waffe Dialog -->
    <q-dialog v-model="showWeaponDialog">
      <q-card style="min-width:300px">
        <q-card-section><div class="text-h6">{{ editingWeapon ? 'Waffe bearbeiten' : 'Waffe hinzufügen' }}</div></q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="weaponForm.name" label="Name" dense autofocus />
          <q-select
            v-model="weaponForm.skillId"
            :options="skillOptions"
            option-value="id" option-label="name"
            emit-value map-options
            label="Verknüpfte Fertigkeit (optional)"
            dense clearable
            color="secondary"
            @update:model-value="onSkillSelected"
          >
            <template #option="scope">
              <q-item-label v-if="scope.opt.isHeader" header class="text-caption text-weight-bold q-py-xs">
                {{ scope.opt.name }}
              </q-item-label>
              <q-item v-else v-bind="scope.itemProps" dense>
                <q-item-section>{{ scope.opt.name }}</q-item-section>
              </q-item>
            </template>
          </q-select>
          <div class="row q-gutter-sm">
            <q-input v-model.number="weaponForm.baseDamage" label="Schaden" type="number" dense class="col" />
            <q-input v-model.number="weaponForm.apCost" label="AP" type="number" dense class="col" />
            <q-input v-model="weaponForm.parryModifier" label="Parade" dense class="col" />
          </div>
          <div class="text-caption text-grey-6 q-mb-xs">Anmerkungen</div>
          <q-editor v-model="weaponForm.notes" min-height="3rem" :toolbar="editorToolbar" :definitions="editorDefinitions" />
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
import draggable from 'vuedraggable'
import { useCharacterStore } from 'src/stores/characterStore'
import { editorToolbar, editorDefinitions } from 'src/composables/useEditorConfig'
import type { Weapon, ManualBonus, WeaponSkill } from 'src/types/character'

const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

function activeBonusSum(bonuses?: ManualBonus[]) {
  return bonuses?.filter(b => b.active).reduce((s, b) => s + b.value, 0) ?? 0
}

// Skill-Optionen mit Gruppen-Headern
interface SkillOption { id: string; name: string; isHeader?: boolean }

const skillOptions = computed((): SkillOption[] => {
  if (!char.value) return []
  const result: SkillOption[] = []
  if (char.value.skills.fighting.length > 0) {
    result.push({ id: '_h_kampf', name: 'Kampf', isHeader: true })
    char.value.skills.fighting.forEach(s => result.push({ id: s.id, name: s.name }))
  }
  if (char.value.skills.general.length > 0) {
    result.push({ id: '_h_allg', name: 'Allgemein', isHeader: true })
    char.value.skills.general.forEach(s => result.push({ id: s.id, name: s.name }))
  }
  return result
})

function linkedSkillName(skillId: string): string {
  if (!char.value) return ''
  const all = [...char.value.skills.fighting, ...char.value.skills.general]
  return all.find(s => s.id === skillId)?.name ?? ''
}

function linkedSkillSummary(skillId: string, weaponBonuses?: ManualBonus[]): string {
  if (!char.value) return ''
  const skill = [...char.value.skills.fighting, ...char.value.skills.general].find(s => s.id === skillId)
  if (!skill) return ''
  const attrVal = char.value.attributes[skill.baseAttribute] ?? 0
  const skillBonus = activeBonusSum(skill.manualBonuses)
  const weaponBonus = activeBonusSum(weaponBonuses)
  const base = skill.value + attrVal
  const total = base + skillBonus + weaponBonus
  let result = `FW ${skill.value} + ${skill.baseAttribute.toUpperCase()} ${attrVal} = ${base}`
  if (skillBonus !== 0) result += ` (Fertigkeit ${skillBonus > 0 ? '+' : ''}${skillBonus})`
  if (weaponBonus !== 0) result += ` (Waffe ${weaponBonus > 0 ? '+' : ''}${weaponBonus})`
  if (skillBonus !== 0 || weaponBonus !== 0) result += ` → ${total}`
  return result
}

// Drag & Drop
function onWeaponsReorder(newList: Weapon[]) {
  store.reorderWeapons(newList.map(w => w.id))
}

function onFightingSkillsReorder(newList: WeaponSkill[]) {
  store.reorderFightingSkills(newList.map(s => s.id))
}

// Skill-Bonus-Dialog (Kampffertigkeiten)
const showBonusDialog = ref(false)
const activeBonusId = ref('')
const editingBonusId = ref('')
const bonusForm = ref({ value: 0, badgeText: '', description: '' })

const activeBonusList = computed(() => {
  const skill = char.value?.skills.fighting.find(s => s.id === activeBonusId.value)
  return skill?.manualBonuses ?? []
})

function openBonusDialog(skillId: string) {
  activeBonusId.value = skillId
  editingBonusId.value = ''
  bonusForm.value = { value: 0, badgeText: '', description: '' }
  showBonusDialog.value = true
}

function startEditBonus(bonus: ManualBonus) {
  editingBonusId.value = bonus.id
  bonusForm.value = { value: bonus.value, badgeText: bonus.badgeText, description: bonus.description }
}

function cancelEditBonus() {
  editingBonusId.value = ''
  bonusForm.value = { value: 0, badgeText: '', description: '' }
}

function saveBonus() {
  if (editingBonusId.value) {
    store.updateSkillBonus(activeBonusId.value, editingBonusId.value, { ...bonusForm.value })
    cancelEditBonus()
  } else {
    store.addSkillBonus(activeBonusId.value, { ...bonusForm.value, active: true })
    bonusForm.value = { value: 0, badgeText: '', description: '' }
  }
}

// Waffen-Bonus-Dialog
const showWeaponBonusDialog = ref(false)
const activeWeaponBonusId = ref('')
const editingWeaponBonusId = ref('')
const weaponBonusForm = ref({ value: 0, badgeText: '', description: '' })

const activeWeaponBonusList = computed(() => {
  const weapon = char.value?.weapons.find(w => w.id === activeWeaponBonusId.value)
  return weapon?.manualBonuses ?? []
})

function openWeaponBonusDialog(weaponId: string) {
  activeWeaponBonusId.value = weaponId
  editingWeaponBonusId.value = ''
  weaponBonusForm.value = { value: 0, badgeText: '', description: '' }
  showWeaponBonusDialog.value = true
}

function startEditWeaponBonus(bonus: ManualBonus) {
  editingWeaponBonusId.value = bonus.id
  weaponBonusForm.value = { value: bonus.value, badgeText: bonus.badgeText, description: bonus.description }
}

function cancelEditWeaponBonus() {
  editingWeaponBonusId.value = ''
  weaponBonusForm.value = { value: 0, badgeText: '', description: '' }
}

function saveWeaponBonus() {
  if (editingWeaponBonusId.value) {
    store.updateWeaponBonus(activeWeaponBonusId.value, editingWeaponBonusId.value, { ...weaponBonusForm.value })
    cancelEditWeaponBonus()
  } else {
    store.addWeaponBonus(activeWeaponBonusId.value, { ...weaponBonusForm.value, active: true })
    weaponBonusForm.value = { value: 0, badgeText: '', description: '' }
  }
}

// Waffe Dialog
const showWeaponDialog = ref(false)
const editingWeapon = ref<Weapon | null>(null)
const weaponForm = ref<Omit<Weapon, 'id' | 'manualBonuses'>>({
  name: '', baseDamage: 0, apCost: 1, parryModifier: '+/-0', notes: '', isActive: true,
})

function openAddWeapon() {
  editingWeapon.value = null
  weaponForm.value = { name: '', baseDamage: 0, apCost: 1, parryModifier: '+/-0', notes: '', isActive: true }
  showWeaponDialog.value = true
}

function openEditWeapon(w: Weapon) {
  editingWeapon.value = w
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { manualBonuses: _mb, ...rest } = w
  weaponForm.value = { ...rest }
  showWeaponDialog.value = true
}

function onSkillSelected(skillId: string | null) {
  if (!skillId || skillId.startsWith('_h_') || !char.value) return
  const fighting = char.value.skills.fighting.find(s => s.id === skillId)
  if (fighting) {
    weaponForm.value.baseDamage = fighting.baseDamage
    weaponForm.value.apCost = fighting.apCost
    weaponForm.value.parryModifier = fighting.parryModifier
  }
}

function saveWeapon() {
  if (editingWeapon.value) store.updateWeapon(editingWeapon.value.id, weaponForm.value)
  else store.addWeapon(weaponForm.value)
  showWeaponDialog.value = false
}
</script>
