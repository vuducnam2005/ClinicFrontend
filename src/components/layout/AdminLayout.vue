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
import {
 Calendar,
 CreditCard,
 LayoutDashboard,
 Pill,
 Receipt,
 Settings,
 Stethoscope,
 UserRound,
 Users,
} from 'lucide-vue-next'
import SidebarNav from './SidebarNav.vue'

const menuGroups = [
 {
 title: '',
 items: [{ label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard }],
 },
 {
 title: 'Quản lý phòng khám',
 items: [
 { label: 'Bác sĩ', to: '/admin/doctors', icon: Stethoscope },
 { label: 'Chuyên khoa', to: '/admin/specialties', icon: Settings },
 { label: 'Lịch làm việc', to: '/admin/schedules', icon: Calendar },
 { label: 'Bệnh nhân', to: '/admin/patients', icon: UserRound },
 { label: 'Lịch hẹn', to: '/admin/appointments', icon: Calendar },
 ],
 },
 {
 title: 'Dược & Viện phí',
 items: [
 { label: 'Kho thuốc', to: '/admin/medicines', icon: Pill },
 { label: 'Đơn thuốc', to: '/admin/prescriptions', icon: Receipt },
 { label: 'Hóa đơn', to: '/admin/bills', icon: CreditCard },
 ],
 },
 {
 title: 'Hệ thống',
 items: [
 { label: 'Tài khoản', to: '/admin/accounts', icon: Users },
 { label: 'Báo cáo', to: '/admin/reports', icon: LayoutDashboard },
 ],
 },
]
</script>