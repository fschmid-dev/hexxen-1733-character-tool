<template>
  <div class="text-center q-pa-xs">
    <div class="text-caption text-grey-6">{{ label }}</div>
    <div class="row items-center justify-center q-gutter-xs">
      <q-btn flat dense round icon="remove" size="xs" @click="$emit('decrement')" />
      <div class="text-subtitle1 text-weight-bold" :class="value > 0 ? 'text-negative' : ''">
        {{ value }}
      </div>
      <q-btn flat dense round icon="add" size="xs" @click="$emit('increment')" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number }>()
defineEmits<{ increment: []; decrement: [] }>()
</script>
