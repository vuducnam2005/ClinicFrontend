<template>
  <ClinicalPortalLayout :menu-groups="menuGroups" />
</template>

<script setup lang="ts">
import {
 Calendar,
 CreditCard,
 BellRing,
 LayoutDashboard,
 Pill,
 Receipt,
 Settings,
 Stethoscope,
 UserRound,
 Users,
} from 'lucide-vue-next'
import ClinicalPortalLayout from './ClinicalPortalLayout.vue'

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
 { label: 'Thông báo', to: '/admin/notifications', icon: BellRing },
 { label: 'Tài khoản', to: '/admin/accounts', icon: Users },
 { label: 'Báo cáo', to: '/admin/reports', icon: LayoutDashboard },
 ],
 },
]
</script>
