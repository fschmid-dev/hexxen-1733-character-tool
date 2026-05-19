<template>
  <div class="column items-center q-pa-xs" style="min-width: 80px">
    <div class="text-caption text-weight-bold q-mb-xs" :class="`text-${color}`">{{ abbr }}</div>
    <div class="row items-center no-wrap q-gutter-xs">
      <q-btn flat dense round icon="remove" size="xs" @click="$emit('decrement')" />
      <div class="text-h6 text-weight-bold" style="min-width: 20px; text-align: center">{{ value }}</div>
      <q-btn flat dense round icon="add" size="xs" @click="$emit('increment')" />
    </div>
    <div class="text-caption text-grey-5 q-mt-xs" style="font-size: 0.6rem; text-align: center; max-width: 80px; line-height: 1.1">
      {{ label }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; abbr: string; value: number; color: string }>()
defineEmits<{ increment: []; decrement: [] }>()
</script>
