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
    <DogkyChatbot v-if="authStore.isAuthenticated" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import DogkyChatbot from '@/components/chatbot/DogkyChatbot.vue'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const authStore = useAuthStore()
const isWorkspaceRoute = computed(() => /^\/(admin|doctor|nurse|patient)(\/|$)/.test(route.path))
const isAuthRoute = computed(() => /^\/(login|register)(\/|$)/.test(route.path))
</script>
