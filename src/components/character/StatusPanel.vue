<template>
  <div v-if="char" class="q-gutter-sm q-pb-xl">

    <!-- Attribute: 3 pro Reihe, 2 Reihen -->
    <div class="text-overline text-primary q-mb-xs">Attribute</div>
    <q-card flat bordered>
      <q-card-section class="q-pa-xs">
        <div class="row wrap">
          <div v-for="attr in attributeList" :key="attr.key" class="col-4 flex flex-center q-py-xs">
            <AttributeCounter
              :label="attr.label" :abbr="attr.abbr" :color="attr.color" :value="char.attributes[attr.key]"
              @increment="store.updateAttribute(attr.key, char.attributes[attr.key] + 1)"
              @decrement="store.updateAttribute(attr.key, char.attributes[attr.key] - 1)"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Ressourcen: 2 auf Mobile, 4 auf Desktop -->
    <div class="text-overline text-primary q-mb-xs">Ressourcen</div>
    <q-card flat bordered>
      <q-card-section class="q-pa-xs">
        <div class="row wrap">
          <div v-for="res in resourceList" :key="res.key" class="col-6 col-sm-3">
            <ResourceCounter
              :label="res.label" :value="char.resources[res.key]" :max-value="res.maxValue"
              @increment="store.updateResource(res.key, char.resources[res.key] + 1)"
              @decrement="store.updateResource(res.key, char.resources[res.key] - 1)"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Anhaltende Einflüsse: 2 auf Mobile, 4 auf Desktop -->
    <div class="text-overline text-primary q-mb-xs">Anhaltende Einflüsse</div>
    <q-card flat bordered>
      <q-card-section class="q-pa-xs">
        <div class="row wrap">
          <div v-for="fx in statusEffects" :key="fx.key" class="col-6 col-sm-3">
            <StatusStepper
              :label="fx.label" :value="char.statusEffects[fx.key]"
              @increment="store.updateStatusEffect(fx.key, char.statusEffects[fx.key] + 1)"
              @decrement="store.updateStatusEffect(fx.key, char.statusEffects[fx.key] - 1)"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Heilungsfaktor: untereinander auf Mobile, nebeneinander auf Desktop -->
    <div class="text-overline text-primary q-mb-xs">Heilungsfaktor</div>
    <q-card flat bordered>
      <q-card-section class="q-pa-sm">
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 column items-center">
            <div class="text-caption q-mb-xs">Erste Hilfe [EH]</div>
            <q-btn-toggle
              :model-value="char.healingFactor.firstAid"
              :options="[0,1,2].map(v=>({label:String(v),value:v}))"
              unelevated toggle-color="primary" size="sm"
              @update:model-value="v => store.updateField('healingFactor', { ...char!.healingFactor, firstAid: v as 0|1|2 })"
            />
          </div>
          <div class="col-12 col-sm-6 column items-center">
            <div class="text-caption q-mb-xs">Magische Heilung [MH]</div>
            <q-btn-toggle
              :model-value="char.healingFactor.magicalHealing"
              :options="[0,1,2,3,4].map(v=>({label:String(v),value:v}))"
              unelevated toggle-color="primary" size="sm"
              @update:model-value="v => store.updateField('healingFactor', { ...char!.healingFactor, magicalHealing: v as 0|1|2|3|4 })"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from 'src/stores/characterStore'
import type { AttributeKey } from 'src/types/character'
import AttributeCounter from 'src/components/AttributeCounter.vue'
import ResourceCounter from 'src/components/ResourceCounter.vue'
import StatusStepper from 'src/components/StatusStepper.vue'

const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

const attributeList: { key: AttributeKey; label: string; abbr: string; color: string }[] = [
  { key: 'kkr', label: 'Körperkraft',   abbr: 'KKR', color: 'deep-orange-7' },
  { key: 'ath', label: 'Athletik',      abbr: 'ATH', color: 'deep-orange-7' },
  { key: 'ges', label: 'Geschick',      abbr: 'GES', color: 'deep-orange-7' },
  { key: 'sin', label: 'Sinnesschärfe', abbr: 'SIN', color: 'green-7' },
  { key: 'wis', label: 'Wissen',        abbr: 'WIS', color: 'green-7' },
  { key: 'wil', label: 'Willenskraft',  abbr: 'WIL', color: 'green-7' },
]

const resourceList = computed(() => {
  const c = char.value
  if (!c) return []
  return [
    { key: 'ambition'            as const, label: 'Ambition'                      },
    { key: 'rage'                as const, label: 'Rage'                           },
    { key: 'segnung'             as const, label: 'Segnung'                        },
    { key: 'quintessenz'         as const, label: 'Quintessenz'                    },
    { key: 'ideen'               as const, label: `Ideen (max ${store.maxIdeen})`, maxValue: store.maxIdeen },
    { key: 'coups'               as const, label: `Coups (max ${store.maxCoups})`, maxValue: store.maxCoups },
    { key: 'verderbnis'          as const, label: 'Verderbnis'                     },
    { key: 'konstruktionspunkte' as const, label: 'KP'                             },
  ]
})

const statusEffects: { key: keyof NonNullable<typeof char.value>['statusEffects']; label: string }[] = [
  { key: 'malusDamage',    label: 'Malusschaden'  },
  { key: 'externalDamage', label: 'Äuß. Schaden'  },
  { key: 'internalDamage', label: 'Inn. Schaden'   },
  { key: 'paralysis',      label: 'Lähmung'        },
]
</script>
