<template>
  <div class="flex h-screen overflow-hidden bg-[#f4f7fb] text-slate-950">
    <aside
      class="relative hidden shrink-0 flex-col border-r border-slate-200 bg-white/85 shadow-[12px_0_40px_rgba(15,23,42,0.04)] backdrop-blur transition-all duration-300 lg:flex"
      :class="sidebarCollapsed ? 'w-20' : 'w-60'"
    >
      <button
        type="button"
        class="absolute -right-3.5 top-7 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-[#0F52BA]"
        :aria-label="sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <ChevronRight v-if="sidebarCollapsed" class="h-5 w-5" />
        <ChevronLeft v-else class="h-5 w-5" />
      </button>

      <RouterLink to="/" class="flex h-20 items-center px-3" :class="sidebarCollapsed ? 'justify-center px-0' : ''">
        <img v-if="sidebarCollapsed" :src="relIconUrl" alt="MedicareDNU" class="h-11 w-11 rounded-xl object-contain" />
        <img v-else :src="logoUrl" alt="MedicareDNU" class="h-16 w-full object-contain" />
      </RouterLink>

      <nav class="flex-1 space-y-5 overflow-y-auto px-4 pb-5 pt-4">
        <template v-for="group in menuGroups" :key="group.title || 'main'">
          <div>
            <p v-if="group.title && !sidebarCollapsed" class="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {{ group.title }}
            </p>
            <div class="space-y-2">
              <RouterLink
                v-for="item in group.items"
                :key="item.to"
                :to="item.to"
                class="group flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition duration-200 hover:bg-blue-50 hover:text-[#003c90]"
                :class="sidebarCollapsed ? 'justify-center px-3' : ''"
                active-class="bg-[#0F52BA] text-white shadow-[0_14px_34px_rgba(15,82,186,0.28)] hover:bg-[#0F52BA] hover:text-white"
                :title="sidebarCollapsed ? item.label : undefined"
              >
                <component
                  :is="item.icon"
                  class="h-5 w-5 shrink-0 transition"
                  :class="isActive(item.to) ? 'text-white' : 'text-slate-700 group-hover:text-[#003c90]'"
                />
                <span v-if="!sidebarCollapsed">{{ item.label }}</span>
              </RouterLink>
            </div>
          </div>
        </template>
      </nav>

      <div class="border-t border-slate-200 px-4 py-5">
        <button
          type="button"
          class="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          :class="sidebarCollapsed ? 'justify-center px-3' : ''"
          @click="handleLogout"
        >
          <LogOut class="h-5 w-5" />
          <span v-if="!sidebarCollapsed">Đăng xuất</span>
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-20 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-5 lg:px-6">
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
          @click="mobileMenuOpen = true"
        >
          <Menu class="h-6 w-6" />
        </button>

        <div class="relative hidden w-full max-w-2xl items-center md:flex">
          <Search class="pointer-events-none absolute left-5 h-5 w-5 text-slate-500" />
          <input
            class="h-12 w-full rounded-2xl border border-transparent bg-slate-100 pl-[52px] pr-16 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
            type="search"
            placeholder="Tìm kiếm bệnh nhân, hồ sơ bệnh án hoặc lịch hẹn..."
          />
        </div>

        <div class="ml-auto flex items-center gap-4">
          <button type="button" class="relative hidden h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 sm:inline-flex">
            <Bell class="h-5 w-5" />
            <span class="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
          <button type="button" class="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 sm:inline-flex">
            <MessageSquare class="h-5 w-5" />
          </button>

          <div class="hidden h-12 border-l border-slate-200 sm:block"></div>

          <div class="flex items-center gap-3">
            <div class="hidden text-right sm:block">
              <p class="max-w-44 truncate text-sm font-bold text-slate-950">{{ displayName }}</p>
              <p class="text-[11px] font-bold uppercase tracking-wide text-[#0F52BA]">{{ roleName }}</p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-blue-50 text-sm font-bold text-[#003c90] shadow-sm">
              {{ initials }}
            </div>
          </div>
        </div>
      </header>

      <div v-if="mobileMenuOpen" class="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" @click.self="mobileMenuOpen = false">
        <aside class="flex h-full w-80 max-w-[86vw] flex-col bg-white shadow-2xl">
          <div class="flex h-20 items-center justify-between px-5">
            <div class="flex items-center gap-3">
              <img :src="relIconUrl" alt="MedicareDNU" class="h-11 w-11 rounded-xl object-contain" />
              <div>
                <p class="text-lg font-bold text-[#003c90]">MedicareDNU</p>
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Clinical Portal</p>
              </div>
            </div>
            <button type="button" class="rounded-xl p-2 text-slate-500 hover:bg-slate-100" @click="mobileMenuOpen = false">
              <X class="h-5 w-5" />
            </button>
          </div>
          <nav class="flex-1 space-y-6 overflow-y-auto px-4 pb-5">
            <template v-for="group in menuGroups" :key="`mobile-${group.title || 'main'}`">
              <div>
                <p v-if="group.title" class="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-slate-400">{{ group.title }}</p>
                <RouterLink
                  v-for="item in group.items"
                  :key="item.to"
                  :to="item.to"
                  class="mb-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700"
                  active-class="bg-[#0F52BA] text-white"
                  @click="mobileMenuOpen = false"
                >
                  <component :is="item.icon" class="h-5 w-5" />
                  {{ item.label }}
                </RouterLink>
              </div>
            </template>
          </nav>
        </aside>
      </div>

      <main ref="mainRef" class="flex-1 overflow-y-auto">
        <div class="mx-auto min-h-screen max-w-[1600px] px-4 py-5 sm:px-5 lg:px-6">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  X,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import logoUrl from '@/assets/logo.png'
import relIconUrl from '@/assets/rel-icon.png'

defineProps<{
  menuGroups: {
    title?: string
    items: {
      label: string
      to: string
      icon: any
    }[]
  }[]
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)
const sidebarCollapsed = ref(false)
const mainRef = ref<HTMLElement | null>(null)

const displayName = computed(() => authStore.user?.fullName || authStore.user?.username || 'Người dùng')
const initials = computed(() => displayName.value.trim().charAt(0).toUpperCase() || 'U')
const roleName = computed(() => {
  if (authStore.isAdmin) return 'Quản trị viên'
  if (authStore.isDoctor) return 'Bác sĩ'
  if (authStore.isReceptionist) return 'Điều phối y tế'
  if (authStore.isPatient) return 'Bệnh nhân'
  return 'Clinical Portal'
})

watch(
  () => route.fullPath,
  () => {
    requestAnimationFrame(() => mainRef.value?.scrollTo({ top: 0, behavior: 'auto' }))
  },
)

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
