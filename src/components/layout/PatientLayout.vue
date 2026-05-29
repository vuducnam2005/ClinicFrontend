<template>
  <div class="min-h-screen bg-slate-50">
    <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div class="container-page flex h-16 items-center justify-between">
        <RouterLink to="/patient/dashboard" class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-card">
            <HeartPulse class="h-5 w-5" />
          </span>
          <span class="hidden sm:block">
            <span class="block text-lg font-bold text-slate-900">ClinicCare</span>
            <span class="block text-xs font-semibold uppercase tracking-wide text-teal-700">Patient Portal</span>
          </span>
        </RouterLink>

        <nav class="hidden items-center gap-1 lg:flex">
          <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link" active-class="nav-link-active">
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="flex items-center gap-3">
          <div class="hidden items-center gap-2 sm:flex">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
              {{ authStore.user?.fullName?.charAt(0) || 'U' }}
            </div>
            <div class="leading-tight">
              <p class="text-sm font-semibold text-slate-800">{{ authStore.user?.fullName }}</p>
              <p class="text-xs text-slate-500">PatientId #{{ authStore.user?.patientId || 4 }}</p>
            </div>
          </div>
          <button type="button" class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" title="??ng xu?t" @click="handleLogout">
            <LogOut class="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>

    <div class="border-b border-slate-200 bg-white lg:hidden">
      <nav class="flex min-w-max gap-2 overflow-x-auto px-4 py-3">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600" active-class="bg-teal-50 text-teal-700">
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <main class="py-8">
      <div class="container-page">
        <RouterView />
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HeartPulse, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import AppFooter from './AppFooter.vue'

const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { label: 'T?ng quan', to: '/patient/dashboard' },
  { label: '??t l?ch', to: '/patient/booking' },
  { label: 'L?ch h?n', to: '/patient/appointments' },
  { label: 'B?nh ?n', to: '/patient/records' },
  { label: '??n thu?c', to: '/patient/prescriptions' },
  { label: 'Vi?n ph?', to: '/patient/bills' },
  { label: 'H? s?', to: '/patient/profile' },
]

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.nav-link {
  @apply rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700;
}
.nav-link-active {
  @apply bg-teal-50 text-teal-700;
}
</style>
