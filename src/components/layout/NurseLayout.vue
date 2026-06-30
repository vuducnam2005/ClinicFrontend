<template>
  <ClinicalPortalLayout :menu-groups="menuGroups" />
</template>

<script setup lang="ts">
import { CalendarCheck, CreditCard, LayoutDashboard, PackageOpen, Pill, Users, ClipboardList } from 'lucide-vue-next'
import ClinicalPortalLayout from './ClinicalPortalLayout.vue'

const menuGroups = [
  {
    title: '',
    items: [{ label: 'Bảng điều khiển', to: '/nurse/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Tiếp nhận',
    items: [
      { label: 'Lịch hẹn', to: '/nurse/appointments', icon: CalendarCheck },
      { label: 'Bệnh nhân', to: '/nurse/patients', icon: Users },
      { label: 'Hàng đợi khám', to: '/nurse/queue', icon: Users },
    ],
  },
  {
    title: 'Dịch vụ',
    items: [
      { label: 'Thu viện phí', to: '/nurse/bills', icon: CreditCard },
      { label: 'Kho thuốc', to: '/nurse/medicines', icon: PackageOpen },
      { label: 'Yêu cầu nhập kho', to: '/nurse/inventory-slips', icon: ClipboardList },
      { label: 'Phát thuốc', to: '/nurse/prescriptions', icon: Pill },
    ],
  },
]
</script>
