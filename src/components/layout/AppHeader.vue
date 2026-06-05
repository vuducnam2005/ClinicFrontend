<template>
  <header class="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
    <div class="container-page flex h-20 items-center justify-between">
      <RouterLink to="/" class="flex items-center">
        <img :src="logoUrl" alt="MedicareDNU" class="h-14 w-auto max-w-[260px] object-contain md:h-16" />
      </RouterLink>

      <nav class="hidden items-center gap-8 md:flex">
        <a
          v-for="item in landingLinks"
          :key="item.href"
          :href="item.href"
          class="text-xs font-medium text-slate-600 transition hover:text-[#003c90]"
        >
          {{ item.label }}
        </a>
        <RouterLink to="/doctors" class="text-xs font-medium text-slate-600 transition hover:text-[#003c90]">
          Bác sĩ
        </RouterLink>
      </nav>

      <div class="hidden items-center gap-3 md:flex">
        <RouterLink
          v-if="authStore.isAuthenticated"
          :to="dashboardRoute"
          class="text-xs font-semibold text-slate-600 hover:text-[#003c90]"
        >
          Bảng điều khiển
        </RouterLink>
        <RouterLink v-else to="/login" class="text-xs font-semibold text-slate-600 hover:text-[#003c90]">
          Đăng nhập
        </RouterLink>
        <button
          v-if="authStore.isAuthenticated"
          class="text-xs font-semibold text-slate-600 hover:text-rose-600"
          @click="handleLogout"
        >
          Đăng xuất
        </button>
        <RouterLink
          to="/booking"
          class="inline-flex h-10 items-center rounded bg-[#003c90] px-5 text-xs font-semibold text-white transition hover:bg-[#0f52ba]"
        >
          Đặt lịch khám
        </RouterLink>
      </div>

      <button class="rounded border border-slate-200 p-2 text-slate-700 md:hidden" @click="open = !open">
        <Menu v-if="!open" class="h-5 w-5" />
        <X v-else class="h-5 w-5" />
      </button>
    </div>

    <div v-if="open" class="border-t border-slate-200 bg-white md:hidden">
      <div class="container-page grid gap-2 py-4">
        <a
          v-for="item in landingLinks"
          :key="item.href"
          :href="item.href"
          class="rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="open = false"
        >
          {{ item.label }}
        </a>
        <RouterLink
          to="/doctors"
          class="rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="open = false"
        >
          Bác sĩ
        </RouterLink>
        <RouterLink
          to="/booking"
          class="mt-2 inline-flex h-10 items-center justify-center rounded bg-[#003c90] px-5 text-sm font-semibold text-white"
          @click="open = false"
        >
          Đặt lịch khám
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import logoUrl from '@/assets/logo.png'

const open = ref(false)
const router = useRouter()
const authStore = useAuthStore()
const landingLinks = [
  { label: 'Dịch vụ', href: '/#services' },
  { label: 'Quy trình', href: '/#booking-process' },
  { label: 'Cảm nhận', href: '/#testimonials' },
]

const dashboardRoute = computed(() => {
  if (authStore.isAdmin) return '/admin/dashboard'
  if (authStore.isDoctor) return '/doctor/dashboard'
  if (authStore.isReceptionist) return '/nurse/dashboard'
  if (authStore.isPatient) return '/patient/dashboard'
  return '/login'
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
