<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <template v-if="isWorkspaceRoute || isAuthRoute">
      <RouterView />
    </template>
    <template v-else>
      <AppHeader />
      <main>
        <RouterView />
      </main>
      <AppFooter />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const route = useRoute()
const isWorkspaceRoute = computed(() => /^\/(admin|doctor|nurse|patient)(\/|$)/.test(route.path))
const isAuthRoute = computed(() => /^\/(login|register)(\/|$)/.test(route.path))
</script>
