import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/DashboardView.vue') },
      { path: 'characters', component: () => import('pages/CharacterListView.vue') },
      { path: 'compendium', component: () => import('pages/CompendiumListView.vue') },
    ],
  },
  {
    // Charakter-Detail hat ein eigenes Layout mit sticky Stats-Header
    path: '/characters/:id',
    component: () => import('layouts/CharacterLayout.vue'),
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
]

export default routes
