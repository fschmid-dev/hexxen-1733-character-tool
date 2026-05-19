<template>
  <div class="skill-row q-px-sm q-py-sm">
    <!-- Zeile 1: Name + Attribut-Badge + Bonus-Badges -->
    <div class="row no-wrap items-center q-gutter-xs q-mb-xs">
      <div class="col text-body2 text-weight-medium" style="min-width:0">{{ skill.name }}</div>
      <q-badge dense :color="attrColor" :label="skill.baseAttribute.toUpperCase()" />
      <template v-for="bonus in activeBonges" :key="bonus.id">
        <q-badge v-if="bonus.badgeText" dense color="amber-9" :label="bonus.badgeText" />
      </template>
      <q-btn
        v-if="skill.isCustom" flat dense round icon="delete_outline" size="xs" color="negative"
        @click="$emit('remove')"
      />
    </div>
    <!-- Zeile 2: FW-Stepper + Summe -->
    <div class="row items-center q-gutter-xs">
      <span class="text-caption text-grey-5">FW</span>
      <q-btn flat dense round icon="remove" size="xs" @click="$emit('update-value', skill.value - 1)" />
      <span class="text-subtitle2 text-weight-bold" style="min-width:18px;text-align:center">{{ skill.value }}</span>
      <q-btn flat dense round icon="add" size="xs" @click="$emit('update-value', skill.value + 1)" />
      <q-space />
      <span class="text-caption text-grey-5">=</span>
      <span class="text-subtitle2 text-weight-bold text-primary">{{ baseTotal }}</span>
      <span v-if="bonusTotal !== 0" class="text-caption text-amber-9" style="min-width:24px">
        {{ bonusTotal > 0 ? '+' : '' }}{{ bonusTotal }}
      </span>
      <q-btn flat dense round icon="info_outline" size="xs" color="grey-6" @click="$emit('open-dialog')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from 'src/types/character'

const props = defineProps<{ skill: Skill; total: number; attrValue: number }>()
defineEmits<{
  'update-value': [value: number]
  'open-dialog': []
  'remove': []
}>()

const baseTotal = computed(() => props.skill.value + props.attrValue)
const activeBonges = computed(() => props.skill.manualBonuses?.filter(b => b.active) ?? [])
const bonusTotal = computed(() => activeBonges.value.reduce((s, b) => s + b.value, 0))
const attrColor = computed(() =>
  ['kkr', 'ath', 'ges'].includes(props.skill.baseAttribute) ? 'deep-orange-7' : 'green-7'
)
</script>
