<template>
  <div class="q-gutter-sm q-pb-xl">
    <template v-if="char">

      <!-- Ausrüstung & Verbrauchsmittel -->
      <div class="text-overline text-primary q-mb-xs">Ausrüstung &amp; Verbrauchsmittel</div>
      <q-card flat bordered>
        <draggable
          :model-value="char.inventory"
          item-key="id"
          handle=".drag-handle"
          @update:model-value="onInventoryReorder"
        >
          <template #item="{ element: item }">
            <q-item dense>
              <q-item-section avatar class="drag-handle cursor-grab" style="min-width: 24px">
                <q-icon name="drag_indicator" color="grey-5" size="sm" />
              </q-item-section>
              <q-item-section>
                <div class="row items-center q-gutter-xs">
                  <div class="col text-body2">{{ item.name }}</div>
                  <q-badge v-if="item.showOnStatus" color="teal-7" label="Status" size="xs" />
                </div>
                <div v-if="item.notes" class="text-caption text-grey-5" v-html="item.notes" />
              </q-item-section>
              <q-item-section side>
                <div class="row items-center no-wrap q-gutter-xs">
                  <q-btn flat dense round icon="remove" size="xs"
                    @click="store.updateInventoryItem(item.id, { quantity: Math.max(0, item.quantity - 1) })" />
                  <div v-if="editingQuantityId !== item.id"
                    class="text-body2 text-weight-bold cursor-pointer"
                    style="min-width:20px;text-align:center"
                    @click="startQuantityEdit(item.id)">
                    {{ item.quantity }}
                  </div>
                  <input v-else
                    ref="quantityInputRef"
                    type="number"
                    :value="item.quantity"
                    class="qty-direct-input"
                    @change="onQuantityInput(item.id, $event)"
                    @blur="editingQuantityId = null"
                    @keyup.enter="onQuantityInput(item.id, $event)"
                    @keyup.escape="editingQuantityId = null"
                  />
                  <q-btn flat dense round icon="add" size="xs"
                    @click="store.updateInventoryItem(item.id, { quantity: item.quantity + 1 })" />
                  <q-btn flat dense round icon="edit" size="xs" @click="openEditItem(item)" />
                  <q-btn flat dense round icon="delete_outline" size="xs" color="negative"
                    @click="store.removeInventoryItem(item.id)" />
                </div>
              </q-item-section>
            </q-item>
          </template>
        </draggable>
        <q-item v-if="char.inventory.length === 0">
          <q-item-section class="text-grey-5 text-caption">Inventar ist leer</q-item-section>
        </q-item>
        <q-card-actions>
          <q-btn flat color="primary" icon="add" label="Gegenstand hinzufügen" size="sm" @click="openAddItem" />
        </q-card-actions>
      </q-card>

      <!-- Finanzen -->
      <div class="text-overline text-primary q-mb-xs">Finanzen</div>
      <q-card flat bordered>
        <q-card-section class="q-pa-sm">
          <div class="row q-gutter-sm">
            <q-input
              :model-value="char.finances.upkeep"
              label="Unterhalt" type="number" dense class="col"
              @update:model-value="v => store.updateField('finances', { ...char!.finances, upkeep: Number(v) })"
            />
            <q-input
              :model-value="char.finances.wealth"
              label="Vermögen" type="number" dense class="col"
              @update:model-value="v => store.updateField('finances', { ...char!.finances, wealth: Number(v) })"
            />
            <q-input
              :model-value="char.finances.loot"
              label="Beutegut" type="number" dense class="col"
              @update:model-value="v => store.updateField('finances', { ...char!.finances, loot: Number(v) })"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Eigene Waffen -->
      <div class="text-overline text-primary q-mb-xs">Eigene Waffen</div>
      <q-card flat bordered class="q-mb-md">
        <q-list separator>
          <q-item v-for="weapon in char.weapons" :key="weapon.id">
            <q-item-section avatar>
              <q-toggle
                :model-value="weapon.isActive"
                color="primary" dense
                @update:model-value="v => store.updateWeapon(weapon.id, { isActive: v })"
              />
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
                <q-btn flat dense round icon="delete_outline" size="xs" color="negative" @click="store.removeWeapon(weapon.id)" />
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

      <!-- Kleidungssets (aktives Set zuerst) -->
      <template v-if="char.settings.useOptionalClothingSets">
        <div class="text-overline text-primary q-mb-xs">Kleidungssets</div>
        <q-card flat bordered class="q-mb-md">
          <q-list separator>
            <q-item v-for="set in sortedClothingSets" :key="set.id">
              <q-item-section avatar>
                <q-radio
                  :model-value="activeSetId"
                  :val="set.id"
                  color="primary"
                  @update:model-value="store.setActiveClothingSet(set.id)"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label :class="set.isActive ? 'text-weight-bold' : ''">
                  {{ set.name || 'Unbenanntes Set' }}
                  <q-badge v-if="set.isActive" color="positive" label="Aktiv" class="q-ml-xs" />
                </q-item-label>
                <q-item-label v-if="set.effect" caption><span v-html="set.effect" /></q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat dense round icon="edit" size="xs" @click="openEditSet(set)" />
                  <q-btn flat dense round icon="delete_outline" size="xs" color="negative" @click="store.removeClothingSet(set.id)" />
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="char.clothingSets.length === 0">
              <q-item-section class="text-grey-5 text-caption">Noch keine Kleidungssets</q-item-section>
            </q-item>
          </q-list>
          <q-card-actions v-if="char.clothingSets.length < 3">
            <q-btn flat color="primary" icon="add" label="Set hinzufügen" size="sm" @click="openAddSet" />
          </q-card-actions>
        </q-card>
      </template>

    </template>

    <!-- Kleidungsset Dialog -->
    <q-dialog v-model="showSetDialog">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Kleidungsset</div></q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="setForm.name" label="Name" dense autofocus />
          <div class="text-caption text-grey-6 q-mb-xs">Auswirkung</div>
          <q-editor v-model="setForm.effect" min-height="3rem" :toolbar="editorToolbar" :definitions="editorDefinitions" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" :label="editingSet ? 'Speichern' : 'Hinzufügen'" @click="saveSet" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Waffen Dialog -->
    <q-dialog v-model="showWeaponDialog">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Waffe</div></q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="weaponForm.name" label="Name" dense autofocus />
          <div class="row q-gutter-sm">
            <q-input v-model.number="weaponForm.baseDamage" label="Schaden" type="number" dense class="col" />
            <q-input v-model.number="weaponForm.apCost" label="AP-Kosten" type="number" dense class="col" />
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

    <!-- Inventar Dialog -->
    <q-dialog v-model="showItemDialog">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Gegenstand</div></q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="itemForm.name" label="Name" dense autofocus />
          <q-input v-model.number="itemForm.quantity" label="Anzahl" type="number" dense />
          <q-toggle v-model="itemForm.showOnStatus" label="Auf Status-Seite anzeigen" color="primary" dense />
          <div class="text-caption text-grey-6 q-mb-xs">Notizen</div>
          <q-editor v-model="itemForm.notes" min-height="3rem" :toolbar="editorToolbar" :definitions="editorDefinitions" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" :label="editingItem ? 'Speichern' : 'Hinzufügen'" @click="saveItem" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import draggable from 'vuedraggable'
import { useCharacterStore } from 'src/stores/characterStore'
import { editorToolbar, editorDefinitions } from 'src/composables/useEditorConfig'
import type { ClothingSet, Weapon, InventoryItem } from 'src/types/character'

const store = useCharacterStore()
const char = computed(() => store.activeCharacter)
const activeSetId = computed(() => char.value?.clothingSets.find(s => s.isActive)?.id ?? '')

// Aktives Kleidungsset zuerst
const sortedClothingSets = computed(() => {
  if (!char.value) return []
  return [...char.value.clothingSets].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1
    if (!a.isActive && b.isActive) return 1
    return 0
  })
})

// Inventar Drag & Drop
function onInventoryReorder(newList: InventoryItem[]) {
  store.reorderInventory(newList.map(i => i.id))
}

// Direkte Mengenbearbeitung
const editingQuantityId = ref<string | null>(null)
const quantityInputRef = ref<HTMLInputElement | null>(null)

async function startQuantityEdit(id: string) {
  editingQuantityId.value = id
  await nextTick()
  quantityInputRef.value?.select()
}

function onQuantityInput(id: string, e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (!isNaN(v)) store.updateInventoryItem(id, { quantity: Math.max(0, v) })
  editingQuantityId.value = null
}

// Sets
const showSetDialog = ref(false)
const editingSet = ref<ClothingSet | null>(null)
const setForm = ref({ name: '', effect: '' })

function openAddSet() { editingSet.value = null; setForm.value = { name: '', effect: '' }; showSetDialog.value = true }
function openEditSet(s: ClothingSet) { editingSet.value = s; setForm.value = { name: s.name, effect: s.effect }; showSetDialog.value = true }
function saveSet() {
  if (editingSet.value) store.updateClothingSet(editingSet.value.id, setForm.value)
  else store.addClothingSet(setForm.value)
  showSetDialog.value = false
}

// Waffen
const showWeaponDialog = ref(false)
const editingWeapon = ref<Weapon | null>(null)
const weaponForm = ref<Omit<Weapon, 'id' | 'manualBonuses'>>({ name: '', baseDamage: 0, apCost: 1, parryModifier: '+/-0', notes: '', isActive: true })

function openAddWeapon() { editingWeapon.value = null; weaponForm.value = { name: '', baseDamage: 0, apCost: 1, parryModifier: '+/-0', notes: '', isActive: true }; showWeaponDialog.value = true }
function openEditWeapon(w: Weapon) {
  editingWeapon.value = w
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { manualBonuses: _mb, ...rest } = w
  weaponForm.value = { ...rest }
  showWeaponDialog.value = true
}
function saveWeapon() {
  if (editingWeapon.value) store.updateWeapon(editingWeapon.value.id, weaponForm.value)
  else store.addWeapon(weaponForm.value)
  showWeaponDialog.value = false
}

// Inventar
const showItemDialog = ref(false)
const editingItem = ref<InventoryItem | null>(null)
const itemForm = ref<Omit<InventoryItem, 'id'>>({ name: '', quantity: 1, notes: '', showOnStatus: false })

function openAddItem() {
  editingItem.value = null
  itemForm.value = { name: '', quantity: 1, notes: '', showOnStatus: false }
  showItemDialog.value = true
}
function openEditItem(item: InventoryItem) {
  editingItem.value = item
  itemForm.value = { name: item.name, quantity: item.quantity, notes: item.notes, showOnStatus: item.showOnStatus ?? false }
  showItemDialog.value = true
}
function saveItem() {
  if (editingItem.value) store.updateInventoryItem(editingItem.value.id, itemForm.value)
  else store.addInventoryItem(itemForm.value)
  showItemDialog.value = false
}
</script>

<style scoped>
.qty-direct-input {
  width: 40px;
  height: 24px;
  text-align: center;
  border: 1px solid currentColor;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
  font-weight: bold;
  padding: 0 2px;
  outline: none;
}
</style>
