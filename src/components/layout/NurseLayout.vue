<template>
 <div class="flex h-screen overflow-hidden bg-slate-50">
 <SidebarNav :menuGroups="menuGroups" />
 <main class="flex-1 overflow-y-auto">
 <div class="min-h-full p-4 sm:p-6 lg:p-8">
 <router-view />
 </div>
 </main>
 </div>
</template>

<script setup lang="ts">
import { CalendarCheck, CreditCard, LayoutDashboard, Pill, Users } from 'lucide-vue-next'
import SidebarNav from './SidebarNav.vue'

const menuGroups = [
 {
 title: '',
 items: [{ label: 'Dashboard', to: '/nurse/dashboard', icon: LayoutDashboard }],
 },
 {
 title: 'Lễ tân',
 items: [
 { label: 'Lịch hẹn', to: '/nurse/appointments', icon: CalendarCheck },
 { label: 'Tiếp nhận BN', to: '/nurse/patients', icon: Users },
 { label: 'Hàng đợi khám', to: '/nurse/queue', icon: Users },
 ],
 },
 {
 title: 'Dịch vụ',
 items: [
 { label: 'Thu viện phí', to: '/nurse/bills', icon: CreditCard },
 { label: 'Phát thuốc', to: '/nurse/prescriptions', icon: Pill },
 ],
 },
]
</script>