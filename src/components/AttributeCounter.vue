<template>
  <div class="column items-center q-pa-xs" style="min-width: 52px">
    <div class="text-caption text-weight-bold" :class="`text-${color}`">{{ abbr }}</div>
    <q-btn flat dense round icon="add" size="xs" @click="$emit('increment')" />
    <div class="text-h6 text-weight-bold">{{ value }}</div>
    <q-btn flat dense round icon="remove" size="xs" @click="$emit('decrement')" />
    <div class="text-caption text-grey-5" style="font-size: 0.6rem; text-align:center; max-width: 52px; line-height: 1.1">
      {{ label }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; abbr: string; value: number; color: string }>()
defineEmits<{ increment: []; decrement: [] }>()
</script>
