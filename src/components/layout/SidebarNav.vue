<template>
 <div class="flex h-screen flex-col bg-slate-900 text-slate-300 w-64 shrink-0 transition-all duration-300">
 <div class="flex h-16 items-center px-4 shrink-0 border-b border-slate-800">
 <div class="flex items-center gap-3 text-white">
 <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-card">
 <HeartPulse class="h-5 w-5" />
 </span>
 <div class="flex flex-col">
 <span class="text-base font-bold leading-tight">ClinicCare</span>
 <span class="text-xs text-slate-400 leading-tight">{{ roleName }}</span>
 </div>
 </div>
 </div>

 <div class="flex-1 overflow-y-auto py-4">
 <nav class="space-y-1 px-3">
 <template v-for="group in menuGroups" :key="group.title">
 <div v-if="group.title" class="px-3 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
 {{ group.title }}
 </div>
 <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
 class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-800 hover:text-white"
 active-class="bg-teal-500/10 text-teal-400"
 >
 <component :is="item.icon" class="h-5 w-5 shrink-0" :class="$route.path.startsWith(item.to) ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'" />
 {{ item.label }}
 </RouterLink>
 </template>
 </nav>
 </div>

 <div class="border-t border-slate-800 p-4">
 <div class="flex items-center gap-3 mb-4">
 <div class="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 font-bold">
 {{ authStore.user?.fullName?.charAt(0) || 'U' }}
 </div>
 <div class="flex flex-col overflow-hidden">
 <span class="text-sm font-medium text-white truncate">{{ authStore.user?.fullName }}</span>
 <span class="text-xs text-slate-500 truncate">{{ authStore.user?.username }}</span>
 </div>
 </div>
 <button
 @click="handleLogout"
 class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
 >
 <LogOut class="h-5 w-5 shrink-0" />
 Đăng xuất
 </button>
 </div>
 </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { HeartPulse, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps<{
 menuGroups: {
 title?: string
 items: {
 label: string
 to: string
 icon: any
 }[]
 }[]
}>()

const router = useRouter()
const authStore = useAuthStore()

const roleName = computed(() => {
 if (authStore.isAdmin) return 'Admin'
 if (authStore.isDoctor) return 'Bác sĩ'
 if (authStore.isReceptionist) return 'Tiếp tân'
 if (authStore.isPatient) return 'Bệnh nhân'
 return ''
})

function handleLogout() {
 authStore.logout()
 router.push('/login')
}
</script>
