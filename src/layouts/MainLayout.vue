<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold" style="font-size: 1rem">
          HeXXen 1733
        </q-toolbar-title>
        <q-btn flat dense :color="route.path.startsWith('/characters') ? 'white' : 'blue-grey-3'"
          :class="route.path.startsWith('/characters') ? 'text-weight-bold' : ''"
          label="Jäger" size="sm" class="q-mr-xs"
          @click="$router.push('/characters')"
        />
        <q-btn flat dense :color="route.path === '/compendium' ? 'white' : 'blue-grey-3'"
          :class="route.path === '/compendium' ? 'text-weight-bold' : ''"
          label="Kompendium" size="sm" class="q-mr-xs"
          @click="$router.push('/compendium')"
        />
        <q-btn flat round dense :icon="themeIcon" :title="themeTitle" @click="toggleTheme" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useTheme } from 'src/composables/useTheme'

const route = useRoute()
const { themeIcon, themeTitle, toggleTheme } = useTheme()
</script>
