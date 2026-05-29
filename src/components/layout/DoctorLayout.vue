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
import { Calendar, CalendarClock, FileText, LayoutDashboard, Stethoscope, Users } from 'lucide-vue-next'
import SidebarNav from './SidebarNav.vue'

const menuGroups = [
 {
 title: '',
 items: [{ label: 'Dashboard', to: '/doctor/dashboard', icon: LayoutDashboard }],
 },
 {
 title: 'Khám bệnh',
 items: [
 { label: 'Hàng đợi khám', to: '/doctor/queue', icon: Users },
 { label: 'Lịch hẹn hôm nay', to: '/doctor/appointments', icon: CalendarClock },
 { label: 'Khám & Kê đơn', to: '/doctor/examine', icon: Stethoscope },
 { label: 'Lịch sử bệnh án', to: '/doctor/records', icon: FileText },
 ],
 },
 {
 title: 'Cá nhân',
 items: [{ label: 'Lịch làm việc', to: '/doctor/schedule', icon: Calendar }],
 },
]
</script>