<template>
  <div class="text-center q-pa-xs">
    <div class="text-caption text-grey-6 ellipsis">{{ label }}</div>
    <div class="row items-center justify-center q-gutter-xs">
      <q-btn flat dense round icon="remove" size="xs" @click="$emit('decrement')" />
      <div class="text-subtitle1 text-weight-bold">
        {{ value }}<span v-if="maxValue !== undefined" class="text-caption text-grey-5">/{{ maxValue }}</span>
      </div>
      <q-btn flat dense round icon="add" size="xs" @click="$emit('increment')" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number; maxValue?: number | undefined }>()
defineEmits<{ increment: []; decrement: [] }>()
</script>
