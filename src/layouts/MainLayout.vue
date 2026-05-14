<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          v-if="showBack"
          flat round dense icon="arrow_back"
          @click="$router.push('/')"
        />
        <q-toolbar-title class="text-weight-bold" style="font-size: 1rem">
          HeXXen 1733
        </q-toolbar-title>
        <q-btn flat round dense :icon="themeIcon" :title="themeTitle" @click="toggleTheme" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'src/composables/useTheme'

const route = useRoute()
const showBack = computed(() => route.path !== '/')
const { themeIcon, themeTitle, toggleTheme } = useTheme()
</script>
