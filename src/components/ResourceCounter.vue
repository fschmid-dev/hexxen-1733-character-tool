<template>
  <div class="text-center q-pa-xs">
    <div class="text-caption text-grey-6 ellipsis">{{ label }}</div>
    <div class="row items-center justify-center q-gutter-xs">
      <q-btn flat dense round icon="remove" size="xs" @click="$emit('decrement')" />
      <div v-if="!editing" class="text-subtitle1 text-weight-bold cursor-pointer" @click="startEdit">
        {{ value }}<span v-if="maxValue !== undefined" class="text-caption text-grey-5"> / {{ maxValue }}</span>
      </div>
      <input
        v-else
        ref="inputRef"
        type="number"
        :value="value"
        class="resource-direct-input"
        @change="onDirectInput"
        @blur="editing = false"
        @keyup.enter="onDirectInput"
        @keyup.escape="editing = false"
      />
      <q-btn flat dense round icon="add" size="xs" @click="$emit('increment')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

defineProps<{ label: string; value: number; maxValue?: number | undefined }>()
const emit = defineEmits<{ increment: []; decrement: []; 'set-value': [value: number] }>()

const editing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

async function startEdit() {
  editing.value = true
  await nextTick()
  inputRef.value?.select()
}

function onDirectInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (!isNaN(v)) emit('set-value', v)
  editing.value = false
}
</script>

<style scoped>
.resource-direct-input {
  width: 48px;
  height: 26px;
  text-align: center;
  border: 1px solid currentColor;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 1rem;
  font-weight: bold;
  padding: 0 4px;
  outline: none;
}
</style>
