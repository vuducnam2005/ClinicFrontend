<template>
  <header class="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white transition-all duration-300">
    <div class="container-page flex items-center justify-between py-4">
      <!-- Logo & Brand -->
      <RouterLink to="/" class="flex items-center gap-3 group">
        <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-medical group-hover:scale-105 transition-transform duration-300">
          <HeartPulse class="h-5.5 w-5.5" />
        </span>
        <div class="flex flex-col">
          <span class="block text-xl font-bold leading-none tracking-tight text-slate-900">ClinicCare</span>
          <span class="text-xxs font-semibold uppercase tracking-wider text-teal-600 mt-1">Clinic OS</span>
        </div>
      </RouterLink>

      <!-- Center navigation links -->
      <nav class="hidden items-center rounded-2xl border border-slate-200/70 bg-slate-50 p-1 xl:flex">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- Right buttons -->
      <div class="hidden items-center gap-4 lg:flex">
        <RouterLink v-if="!authStore.isAuthenticated" to="/login">
          <BaseButton variant="ghost" class="rounded-2xl">
            <template #icon><LogIn class="h-4 w-4" /></template>
            Đăng nhập
          </BaseButton>
        </RouterLink>
        <div v-else class="flex items-center gap-2">
          <RouterLink :to="dashboardRoute">
            <BaseButton variant="ghost" class="rounded-2xl">
              <template #icon><LayoutDashboard class="h-4 w-4" /></template>
              Dashboard
            </BaseButton>
          </RouterLink>
          <BaseButton variant="ghost" class="rounded-2xl text-rose-600 hover:bg-rose-50 hover:text-rose-700" @click="handleLogout">
            <template #icon><LogOut class="h-4 w-4" /></template>
            Đăng xuất
          </BaseButton>
        </div>

        <RouterLink to="/booking">
          <BaseButton class="rounded-2xl shadow-medical hover:shadow-lg hover:scale-102 active:scale-98 transition-all duration-150">
            <template #icon><CalendarPlus class="h-4 w-4" /></template>
            Đặt lịch ngay
          </BaseButton>
        </RouterLink>
      </div>

      <!-- Mobile triggers -->
      <div class="flex items-center gap-3 xl:hidden">
        <button class="rounded-2xl border border-slate-200/50 p-2 text-slate-700 hover:bg-slate-100 transition" @click="open = !open">
          <Menu v-if="!open" class="h-6 w-6" />
          <X v-else class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Responsive Drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div v-if="open" class="border-t border-slate-200/70 bg-white xl:hidden">
        <div class="container-page space-y-2 py-4">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="block rounded-2xl px-4 py-2.5 text-base font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
            @click="open = false"
          >
            {{ item.label }}
          </RouterLink>
          <div class="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-3">
            <RouterLink v-if="!authStore.isAuthenticated" to="/login" @click="open = false">
              <BaseButton variant="outline" class="w-full rounded-2xl">Đăng nhập</BaseButton>
            </RouterLink>
            <RouterLink v-else :to="dashboardRoute" @click="open = false">
              <BaseButton variant="outline" class="w-full rounded-2xl">Dashboard</BaseButton>
            </RouterLink>
            <RouterLink to="/booking" @click="open = false">
              <BaseButton class="w-full rounded-2xl shadow-medical">Đặt lịch</BaseButton>
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarPlus, HeartPulse, LogIn, LogOut, Menu, X, LayoutDashboard } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/authStore'

const open = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Bác sĩ', to: '/doctors' },
  { label: 'Đặt lịch', to: '/booking' },
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

<style scoped>
.nav-link {
  @apply rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-150 hover:bg-white hover:text-teal-700 hover:shadow-sm;
}
.router-link-active:not([href='/']) {
  @apply bg-white text-teal-700 shadow-sm;
}
.text-xxs {
  font-size: 0.65rem;
}
</style>
