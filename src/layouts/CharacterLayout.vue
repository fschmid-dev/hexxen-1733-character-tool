<template>
  <q-layout view="hHh LpR fFf">
    <q-header class="bg-primary text-white">

      <!-- Titelleiste -->
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back" @click="$router.push('/characters')" />
        <q-toolbar-title class="text-weight-bold text-subtitle1 ellipsis">
          {{ char?.name ?? '–' }}
        </q-toolbar-title>
        <q-btn flat round dense icon="menu_book" title="Journal öffnen" @click="showJournal = true" />
        <q-btn flat round dense :icon="themeIcon" :title="themeTitle" @click="toggleTheme" />
        <q-btn flat round dense icon="more_vert">
          <q-menu>
            <q-list dense>
              <q-item clickable v-close-popup @click="onExport">
                <q-item-section avatar><q-icon name="download" /></q-item-section>
                <q-item-section>Exportieren</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="showSettings = true">
                <q-item-section avatar><q-icon name="settings" /></q-item-section>
                <q-item-section>Einstellungen</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup class="text-negative" @click="onDelete">
                <q-item-section avatar><q-icon name="delete_forever" color="negative" /></q-item-section>
                <q-item-section>Charakter löschen</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>

      <!-- Sticky Stats-Bereich -->
      <div v-if="char" class="q-px-sm q-pb-xs">
        <div class="char-content-frame">
          <div class="stats-box q-pa-sm">

            <!-- Zeile 1: Stufe · Volk · Rolle -->
            <div class="row items-center q-gutter-xs q-mb-sm">
              <span class="text-caption">Stufe {{ char.level }}</span>
              <span v-if="char.volk" class="text-caption" style="opacity:.7">· {{ char.volk }}</span>
              <span v-if="activeRole" class="text-caption text-weight-medium" style="opacity:.85">· {{ activeRole }}</span>
            </div>

            <!-- Zeile 2: Panzerung | AP | Initiative -->
            <div class="row justify-between items-center q-mb-sm" style="gap:8px">
              <!-- Panzerung -->
              <div class="col-auto">
                <div class="stat-label">Panzerung (PW)</div>
                <q-btn-toggle
                  :model-value="char.armor"
                  :options="[{label:'1',value:1},{label:'2',value:2},{label:'3',value:3}]"
                  unelevated size="sm"
                  toggle-color="secondary" toggle-text-color="white"
                  color="blue-grey-7" text-color="grey-3"
                  @update:model-value="v => store.updateField('armor', v as 1|2|3)"
                />
              </div>
              <!-- Aktionspunkte -->
              <div class="col-auto">
                <div class="stat-label">Aktionspunkte</div>
                <div class="row items-center q-gutter-xs no-wrap">
                  <q-btn flat dense round icon="remove" size="xs"
                    @click="store.setCurrentAP(char!.actionPoints.current - 1)" />
                  <div class="text-body2 text-weight-bold" style="min-width:32px;text-align:center">
                    {{ char.actionPoints.current }}<span class="text-caption" style="opacity:.6"> / {{ store.maxAP }}</span>
                  </div>
                  <q-btn flat dense round icon="add" size="xs"
                    @click="store.setCurrentAP(char!.actionPoints.current + 1)" />
                  <q-btn flat dense round icon="refresh" size="xs" title="AP zurücksetzen"
                    @click="store.resetAP()" />
                </div>
              </div>
              <!-- Initiative -->
              <div class="col-auto">
                <div class="stat-label">Initiative</div>
                <div class="row items-center q-gutter-xs no-wrap">
                  <div class="text-body2">{{ store.initiativeBase }}</div>
                  <span class="text-caption" style="opacity:.6">+</span>
                  <input
                    type="number"
                    :value="char.initiativeBonus"
                    class="stat-num-input"
                    @change="e => store.updateField('initiativeBonus', Number((e.target as HTMLInputElement).value))"
                  />
                  <span class="text-caption" style="opacity:.6">=</span>
                  <div class="text-body2 text-weight-bold">{{ store.initiative }}</div>
                </div>
              </div>
            </div>

            <div style="height:1px;background:rgba(255,255,255,0.18);margin-bottom:8px" />

            <!-- Zeile 3: Max-LEP | Aktuelle LEP | Puffer-LEP -->
            <div class="row justify-between items-center" style="gap:8px">
              <!-- Max-LEP -->
              <div class="col-auto">
                <div class="stat-label">Max-LEP</div>
                <div class="row items-center q-gutter-xs no-wrap">
                  <div class="text-body2">{{ store.maxHealthBase }}</div>
                  <span class="text-caption" style="opacity:.6">+</span>
                  <input
                    type="number"
                    :value="char.health.bonusMax"
                    class="stat-num-input"
                    @change="e => store.updateField('health', { ...char!.health, bonusMax: Number((e.target as HTMLInputElement).value) })"
                  />
                  <span class="text-caption" style="opacity:.6">=</span>
                  <div class="text-body2 text-weight-bold">{{ store.maxHealth }}</div>
                </div>
              </div>
              <!-- Aktuelle LEP -->
              <div class="col-auto">
                <div class="stat-label">Aktuelle LEP</div>
                <div class="row items-center q-gutter-xs no-wrap">
                  <q-btn flat dense round icon="remove" size="xs"
                    @click="store.setCurrentHealth(char!.health.current - 1)" />
                  <div class="text-body2 text-weight-bold" style="min-width:28px;text-align:center">
                    {{ char.health.current }}
                  </div>
                  <q-btn flat dense round icon="add" size="xs"
                    @click="store.setCurrentHealth(char!.health.current + 1)" />
                </div>
              </div>
              <!-- Puffer-LEP -->
              <div class="col-auto">
                <div class="stat-label">Puffer-LEP</div>
                <div class="row items-center q-gutter-xs no-wrap">
                  <q-btn flat dense round icon="remove" size="xs"
                    @click="store.setBufferHealth(char!.health.buffer - 1)" />
                  <div class="text-body2 text-weight-bold" style="min-width:24px;text-align:center">
                    {{ char.health.buffer }}
                  </div>
                  <q-btn flat dense round icon="add" size="xs"
                    @click="store.setBufferHealth(char!.health.buffer + 1)" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Tab-Navigation -->
      <div class="char-content-frame">
        <q-tabs
          v-model="activeTab"
          dense align="left"
          indicator-color="secondary"
          active-color="white"
          class="q-px-xs"
          mobile-arrows
          narrow-indicator
        >
          <q-tab name="hunter"    label="Jäger"        />
          <q-tab name="status"    label="Status"       />
          <q-tab name="skills"    label="Fertigkeiten" />
          <q-tab name="combat"    label="Kampf"        />
          <q-tab name="powers"    label="Kräfte"       />
          <q-tab name="equipment" label="Ausrüstung"   />
          <q-tab name="tactics"   label="Taktik"       />
        </q-tabs>
      </div>
    </q-header>

    <!-- Tab-Inhalte -->
    <q-page-container>
      <q-page class="q-pa-sm q-pb-xl">
        <div class="char-content-frame">
          <q-tab-panels v-model="activeTab" animated keep-alive swipeable>
            <q-tab-panel name="hunter"    class="q-pa-sm"><HunterPanel /></q-tab-panel>
            <q-tab-panel name="status"    class="q-pa-sm"><StatusPanel /></q-tab-panel>
            <q-tab-panel name="skills"    class="q-pa-sm"><SkillsPanel /></q-tab-panel>
            <q-tab-panel name="combat"    class="q-pa-sm"><CombatPanel /></q-tab-panel>
            <q-tab-panel name="powers"    class="q-pa-sm"><PowersPanel /></q-tab-panel>
            <q-tab-panel name="equipment" class="q-pa-sm"><EquipmentPanel /></q-tab-panel>
            <q-tab-panel name="tactics"   class="q-pa-sm"><TacticsPanel /></q-tab-panel>
          </q-tab-panels>
        </div>
      </q-page>
    </q-page-container>

    <!-- Journal Modal -->
    <JournalDialog v-model="showJournal" />

    <!-- Einstellungen Dialog -->
    <q-dialog v-model="showSettings">
      <q-card style="min-width: 300px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Einstellungen</div>
          <q-space /><q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section v-if="char" class="q-gutter-sm">
          <q-toggle
            :model-value="char.settings.useOptionalClothingSets"
            label="Kleidungssets verwenden"
            color="primary"
            @update:model-value="v => store.updateField('settings', { ...char!.settings, useOptionalClothingSets: v })"
          />
          <q-toggle
            :model-value="char.settings.useOptionalMotivations"
            label="Motivation verwenden"
            color="primary"
            @update:model-value="v => store.updateField('settings', { ...char!.settings, useOptionalMotivations: v })"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useCharacterStore } from 'src/stores/characterStore'
import { useTheme } from 'src/composables/useTheme'

import HunterPanel    from 'src/components/character/HunterPanel.vue'
import StatusPanel    from 'src/components/character/StatusPanel.vue'
import SkillsPanel    from 'src/components/character/SkillsPanel.vue'
import CombatPanel    from 'src/components/character/CombatPanel.vue'
import PowersPanel    from 'src/components/character/PowersPanel.vue'
import EquipmentPanel from 'src/components/character/EquipmentPanel.vue'
import TacticsPanel   from 'src/components/character/TacticsPanel.vue'
import JournalDialog  from 'src/components/character/JournalDialog.vue'

const store = useCharacterStore()
const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const activeTab = ref('hunter')
const showJournal = ref(false)
const showSettings = ref(false)
const { themeIcon, themeTitle, toggleTheme } = useTheme()

onMounted(() => {
  const id = route.params.id as string
  if (id && store.characters.some(c => c.id === id)) {
    store.switchCharacter(id)
  } else {
    void router.push('/characters')
  }
})

const char = computed(() => store.activeCharacter)
const activeRole = computed(() => char.value?.roles.find(r => r) ?? '')

function onExport() {
  try {
    const json = store.exportCharacterJSON()
    const name = char.value?.name ?? 'charakter'
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    $q.notify({ type: 'negative', message: 'Export fehlgeschlagen' })
  }
}

function onDelete() {
  if (!char.value) return
  $q.dialog({
    title: 'Charakter löschen',
    message: `„${char.value.name}" wirklich löschen?`,
    ok: { label: 'Löschen', color: 'negative' },
    cancel: { label: 'Abbrechen', flat: true },
  }).onOk(() => {
    void store.deleteCharacter(char.value!.id).then(() => router.push('/characters'))
  })
}
</script>
