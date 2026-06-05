<template>
 <section class="section-pad bg-white relative overflow-hidden">
 <div class="container-page">
 <!-- Section Header -->
 <div v-reveal class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end mb-16">
 <div class="max-w-2xl">
 <span class="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-500/10 px-3 py-1 rounded-full">
 Kiến trúc hệ thống
 </span>
 <h2 class="section-title mt-4">Bản đồ dịch vụ phòng khám</h2>
 <p class="section-subtitle mt-3">
 Hệ thống phân rã thành các dịch vụ biên dịch độc lập N1, N2, N3 kết nối thống nhất qua Reverse Proxy, đảm bảo khả năng mở rộng tối đa.
 </p>
 </div>
 <div class="rounded-2xl border border-slate-200/50 bg-slate-50 px-5 py-4 text-sm text-slate-500 self-start lg:self-auto shadow-soft">
 Local Proxy Routing: <span class="font-bold text-slate-800 ">/n1</span> • 
 <span class="font-bold text-slate-800 ">/n2</span> • 
 <span class="font-bold text-slate-800 ">/n3</span>
 </div>
 </div>

 <!-- API Gateway Visualization Node -->
 <div v-reveal class="relative flex flex-col items-center justify-center mb-16">
 <!-- Connecting paths to services -->
 <div class="hidden lg:block absolute bottom-[-4rem] left-[18%] right-[18%] h-16 border-l-2 border-r-2 border-dashed border-teal-200/60 -z-10"></div>
 <div class="hidden lg:block absolute bottom-[-4rem] left-[50%] h-16 border-l-2 border-dashed border-teal-200/60 -z-10"></div>

 <div class="rounded-3xl border border-slate-200/60 bg-white px-6 py-4 shadow-floating flex items-center gap-3.5 z-10">
 <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-medical">
 <Cpu class="h-5.5 w-5.5 animate-pulse" />
 </div>
 <div>
 <h4 class="text-xxs font-extrabold uppercase tracking-wider text-slate-400 ">Reverse Proxy Gateway</h4>
 <p class="text-sm font-bold text-slate-800 ">http://localhost:5173/ [Vite Config Proxy]</p>
 </div>
 </div>
 </div>

 <!-- Services List (N1, N2, N3) -->
 <div class="grid gap-6 lg:grid-cols-3 relative">
 <div
 v-for="service in services"
 :key="service.title"
 v-reveal
 class="group rounded-3xl border border-slate-200/60 bg-white overflow-hidden shadow-soft hover:shadow-medical hover:-translate-y-1 transition-all duration-300"
 >
 <!-- Elegant status bar inside card -->
 <div class="h-2 w-full" :class="service.barClass"></div>
 
 <div class="p-8">
 <div class="flex items-start justify-between gap-4">
 <div class="flex items-center gap-3.5">
 <div class="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-medical group-hover:scale-105 transition-transform duration-300" :class="service.iconClass">
 <component :is="service.icon" class="h-6 w-6" />
 </div>
 <div>
 <p class="text-xxs font-bold uppercase tracking-wider" :class="service.textClass">{{ service.group }} DỊCH VỤ</p>
 <h3 class="mt-0.5 text-lg font-bold text-slate-900 ">{{ service.title }}</h3>
 </div>
 </div>
 <!-- Live health check status indicator -->
 <span class="rounded-full px-3 py-1 text-xxs font-bold uppercase tracking-wider flex items-center gap-1 border" :class="statusClass(service.key)">
 <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(service.key)"></span>
 {{ statusLabel(service.key) }}
 </span>
 </div>

 <p class="mt-6 text-sm leading-relaxed text-slate-500 ">{{ service.description }}</p>
 
 <!-- Features check circle list -->
 <div class="mt-6 space-y-3.5">
 <div v-for="feature in service.features" :key="feature" class="flex gap-3.5 text-sm text-slate-600 ">
 <CheckCircle2 class="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal-500 " />
 <span>{{ feature }}</span>
 </div>
 </div>

 <!-- Route codes -->
 <div class="mt-8 border-t border-slate-100 pt-4 flex flex-col gap-2">
 <span class="text-xxs font-bold uppercase tracking-wider text-slate-400 ">Endpoints liên kết</span>
 <p class="rounded-xl bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-600 overflow-x-auto truncate">
 {{ service.route }}
 </p>
 
 <!-- N2 dynamic state or mock warnings -->
 <p v-if="service.key === 'medicalRecord'" class="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
 <span class="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
 {{ n2DataMessage }}
 </p>
 <!-- N3 dynamic state -->
 <p v-if="service.key === 'billing'" class="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
 <span class="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
 Đã kết nối với backend N3.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, type Component } from 'vue'
import { CheckCircle2, ClipboardPlus, FileHeart, ReceiptText, Cpu } from 'lucide-vue-next'
import { appointmentApi } from '@/services/appointmentApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { billingApi } from '@/services/billingApi'

type ServiceKey = 'appointment' | 'medicalRecord' | 'billing'
type ServiceStatus = 'checking' | 'healthy' | 'error'

const status = reactive<Record<ServiceKey, ServiceStatus>>({
  appointment: 'checking',
  medicalRecord: 'checking',
  billing: 'checking',
})

const n2DataMessage = ref('Đang kiểm tra kết nối hồ sơ...')

const services: Array<{
 key: ServiceKey
 group: string
 title: string
 description: string
 route: string
 features: string[]
 icon: Component
 iconClass: string
 barClass: string
 textClass: string
}> = [
 {
 key: 'appointment',
 group: 'N1',
 title: 'Appointment Service',
 description: 'Điều phối đặt lịch, hồ sơ bác sĩ, chuyên khoa, slot trống và quản lý hàng chờ khám.',
 route: '/api/appointments, /api/doctors, /api/waiting-queue',
 features: ['Hồ sơ bác sĩ và chuyên khoa', 'Đặt lịch khám chống trùng chéo', 'Xác nhận lịch, xếp hàng chờ'],
 icon: ClipboardPlus,
 iconClass: 'bg-gradient-to-br from-teal-500 to-cyan-600',
 barClass: 'bg-teal-500',
 textClass: 'text-teal-600 ',
 },
 {
 key: 'medicalRecord',
 group: 'N2',
 title: 'Medical Record Service',
 description: 'Quản lý danh sách hồ sơ bệnh nhân, bệnh án lâm sàng, chẩn đoán và đơn thuốc.',
 route: '/api/patients, /api/medical-records, /api/prescriptions',
 features: ['Danh mục hồ sơ bệnh nhân', 'Ghi nhận bệnh án lâm sàng', 'Kê đơn sau khi chẩn đoán'],
 icon: FileHeart,
 iconClass: 'bg-gradient-to-br from-emerald-500 to-teal-600',
 barClass: 'bg-emerald-500',
 textClass: 'text-emerald-600 ',
 },
 {
 key: 'billing',
 group: 'N3',
 title: 'Pharmacy & Billing Service',
 description: 'Quản lý bảo mật JWT, hóa đơn, viện phí, kho dược phẩm mẫu và giao dịch.',
 route: '/api/Auth, /api/billing, /api/Medicines',
 features: ['Đăng nhập phân hệ 4 vai trò', 'Danh mục kho thuốc mẫu', 'Thanh toán & thu viện phí'],
 icon: ReceiptText,
 iconClass: 'bg-gradient-to-br from-blue-500 to-slate-700',
 barClass: 'bg-blue-500',
 textClass: 'text-blue-600 ',
 },
]

onMounted(() => {
 checkAppointment()
 checkMedicalRecord()
 checkBilling()
})

async function checkAppointment() {
 try {
 await appointmentApi.getHealth()
 status.appointment = 'healthy'
 } catch {
 status.appointment = 'error'
 }
}

async function checkMedicalRecord() {
 try {
 await medicalRecordApi.getHealth()
 status.medicalRecord = 'healthy'
 } catch {
 status.medicalRecord = 'error'
 n2DataMessage.value = 'Chưa truy cập được API N2.'
 return
 }

 try {
 const patients = await medicalRecordApi.getPatients()
 n2DataMessage.value = patients.length
 ? `Data API OK: có ${patients.length} bệnh nhân.`
 : 'Data API OK: chưa có bệnh nhân nào.'
 } catch {
 n2DataMessage.value = 'Health OK, nhưng /api/patients lỗi CORS.'
 }
}

async function checkBilling() {
  try {
    await billingApi.getHealth()
    status.billing = 'healthy'
  } catch {
    status.billing = 'error'
  }
}

function statusLabel(key: ServiceKey) {
  const map: Record<ServiceStatus, string> = {
    checking: 'Checking',
    healthy: 'Healthy',
    error: 'Offline',
  }
  return map[status[key]]
}

function statusClass(key: ServiceKey) {
  const map: Record<ServiceStatus, string> = {
    checking: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    healthy: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    error: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  }
  return map[status[key]]
}

function statusDotClass(key: ServiceKey) {
  const map: Record<ServiceStatus, string> = {
    checking: 'bg-cyan-500 animate-pulse',
    healthy: 'bg-teal-500 animate-pulse',
    error: 'bg-rose-500',
  }
  return map[status[key]]
}
</script>

<style scoped>
.text-xxs {
 font-size: 0.68rem;
}
.text-xxs {
 font-size: 0.65rem;
}
</style>
