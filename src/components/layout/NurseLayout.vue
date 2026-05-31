<template>
  <ClinicalPortalLayout :menu-groups="menuGroups" />
</template>

<script setup lang="ts">
import { CalendarCheck, CreditCard, LayoutDashboard, Pill, Users } from 'lucide-vue-next'
import ClinicalPortalLayout from './ClinicalPortalLayout.vue'

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
