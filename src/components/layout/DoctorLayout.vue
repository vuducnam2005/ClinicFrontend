<template>
  <ClinicalPortalLayout :menu-groups="menuGroups" />
</template>

<script setup lang="ts">
import { Calendar, CalendarClock, FileText, LayoutDashboard, Stethoscope, Users } from 'lucide-vue-next'
import ClinicalPortalLayout from './ClinicalPortalLayout.vue'

const menuGroups = [
  {
    title: '',
    items: [{ label: 'Bảng điều khiển', to: '/doctor/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Khám bệnh',
    items: [
      { label: 'Lịch hẹn', to: '/doctor/appointments', icon: CalendarClock },
      { label: 'Hàng đợi khám', to: '/doctor/queue', icon: Users },
      { label: 'Khám & kê đơn', to: '/doctor/examine', icon: Stethoscope },
      { label: 'Lịch sử bệnh án', to: '/doctor/records', icon: FileText },
    ],
  },
  {
    title: 'Cá nhân',
    items: [{ label: 'Lịch làm việc', to: '/doctor/schedule', icon: Calendar }],
  },
]
</script>
