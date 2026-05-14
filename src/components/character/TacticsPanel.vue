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

      <template v-for="trigger in triggerGroups" :key="trigger.key">
        <template v-if="trigger.effects.length > 0">
          <div class="text-overline text-primary q-mb-xs q-mt-md">{{ trigger.label }}</div>
          <q-card flat bordered class="q-mb-sm">
            <q-list separator dense>
              <q-item v-for="effect in trigger.effects" :key="effect.id">
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ effect.sourceName }}</q-item-label>
                  <q-item-label caption>{{ effect.description }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat dense round icon="delete_outline" size="xs" color="negative"
                    @click="store.removeGameEffect(effect.id)" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </template>
      </template>
    </template>

    <!-- Add Dialog -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Taktik-Effekt hinzufügen</div></q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="form.sourceName" label="Quelle (z.B. Kleidungsset)" dense autofocus />
          <q-select
            v-model="form.trigger"
            :options="triggerOptions"
            option-value="value"
            option-label="label"
            emit-value map-options
            label="Auslöser" dense
          />
          <q-input v-model="form.description" label="Beschreibung" type="textarea" rows="3" dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" label="Hinzufügen" @click="saveEffect" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from 'src/stores/characterStore'
import type { GameEffect } from 'src/types/character'

const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

const triggerOptions: { label: string; value: GameEffect['trigger'] }[] = [
  { label: 'Passiv',            value: 'Passiv' },
  { label: 'Kampfbeginn',       value: 'Kampfbeginn' },
  { label: 'Initiative 0',      value: 'Ini0' },
  { label: 'Einmal pro Kampf',  value: 'EinmalProKampf' },
  { label: 'Fertigkeitsprobe',  value: 'SkillProbe' },
  { label: 'Sonstiges',         value: 'Sonstiges' },
]

const triggerGroups = computed(() =>
  triggerOptions.map(opt => ({
    key: opt.value,
    label: opt.label,
    effects: char.value?.activeGameEffects.filter(e => e.trigger === opt.value) ?? [],
  })),
)

const showDialog = ref(false)
const form = ref<Omit<GameEffect, 'id'>>({ trigger: 'Passiv', sourceName: '', description: '' })

function openAddEffect() {
  form.value = { trigger: 'Passiv', sourceName: '', description: '' }
  showDialog.value = true
}

function saveEffect() {
  if (form.value.sourceName.trim()) {
    store.addGameEffect({ ...form.value })
    showDialog.value = false
  }
}
</script>
