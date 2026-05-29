<template>
 <section class="space-y-6">
 <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
 <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Admin workspace</p>
 <h1 class="mt-2 text-3xl font-bold tracking-normal text-slate-950">Tổng quan vận hành ClinicCare</h1>
 <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
 Theo dõi nhanh dữ liệu N1 Appointment, N2 Medical Record và N3 Pharmacy & Billing. Nếu service chưa trả dữ liệu, giao diện vẫn hiển thị dữ liệu mẫu có ghi chú để không bị trắng trang.
 </p>
 </div>
 <BaseButton variant="outline" :disabled="loading" @click="loadDashboard">
 <template #icon><RefreshCw class="h-4 w-4" /></template>
 Tải lại dữ liệu
 </BaseButton>
 </div>
 </div>

 <div v-if="error" class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
 <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0" />
 <span>{{ error }}</span>
 </div>

 <div v-if="loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <LoadingSkeleton v-for="item in 4" :key="item" />
 </div>

 <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <RouterLink
 v-for="stat in statCards"
:key="stat.label"
:to="stat.to"
 class="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-soft"
 >
 <div class="flex items-start justify-between gap-4">
 <div>
 <p class="text-sm font-medium text-slate-500">{{ stat.label }}</p>
 <p class="mt-3 text-3xl font-bold text-slate-950">{{ stat.value }}</p>
 <p class="mt-2 text-xs font-medium text-slate-500">{{ stat.note }}</p>
 </div>
 <span :class="['flex h-12 w-12 items-center justify-center rounded-xl', stat.iconClass]">
 <component :is="stat.icon" class="h-6 w-6" />
 </span>
 </div>
 </RouterLink>
 </div>

 <div class="grid gap-4 lg:grid-cols-3">
 <div
 v-for="service in serviceCards"
:key="service.name"
 class="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
 >
 <div class="flex items-start justify-between gap-4">
 <div class="flex items-center gap-3">
 <span :class="['flex h-11 w-11 items-center justify-center rounded-xl', service.iconClass]">
 <component :is="service.icon" class="h-5 w-5" />
 </span>
 <div>
 <h2 class="font-semibold text-slate-950">{{ service.name }}</h2>
 <p class="mt-1 text-xs font-medium text-slate-500">{{ service.scope }}</p>
 </div>
 </div>
 <span :class="['rounded-full px-3 py-1 text-xs font-semibold', serviceStatusClass(service.status)]">
 {{ serviceStatusLabel(service.status) }}
 </span>
 </div>
 <p class="mt-4 text-sm leading-6 text-slate-600">{{ service.description }}</p>
 <p class="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">{{ service.endpoints }}</p>
 </div>
 </div>

 <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
 <div class="rounded-2xl border border-slate-200 bg-white shadow-card">
 <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
 <div>
 <h2 class="font-semibold text-slate-950">Lịch hẹn gần đây</h2>
 <p class="mt-1 text-sm text-slate-500">Nguồn N1 - Appointment Service</p>
 </div>
 <RouterLink to="/admin/appointments" class="text-sm font-semibold text-teal-700 hover:text-teal-800">Xem tất cả</RouterLink>
 </div>
 <div class="overflow-x-auto">
 <table class="min-w-full divide-y divide-slate-100 text-sm">
 <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 <tr>
 <th class="px-5 py-3">Mã</th>
 <th class="px-5 py-3">Bệnh nhân</th>
 <th class="px-5 py-3">Bác sĩ</th>
 <th class="px-5 py-3">Ngày giờ</th>
 <th class="px-5 py-3">Trạng thái</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-slate-100">
 <tr v-for="appointment in recentAppointments" :key="appointment.appointmentId" class="hover:bg-slate-50">
 <td class="px-5 py-4 font-mono text-xs text-slate-500">#{{ appointment.appointmentId }}</td>
 <td class="px-5 py-4 font-semibold text-slate-900">{{ displayText(appointment.patientName) }}</td>
 <td class="px-5 py-4 text-slate-600">{{ displayText(appointment.doctorName) }}</td>
 <td class="px-5 py-4 text-slate-600">{{ formatDate(appointment.appointmentDate) }} · {{ appointment.slotTime }}</td>
 <td class="px-5 py-4">
 <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(appointment.status)]">{{ appointment.status }}</span>
 </td>
 </tr>
 <tr v-if="!recentAppointments.length">
 <td colspan="5" class="px-5 py-10 text-center text-sm text-slate-500">Chưa có lịch hẹn để hiển thị.</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 <div class="space-y-6">
 <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
 <div class="flex items-center justify-between">
 <div>
 <h2 class="font-semibold text-slate-950">Cảnh báo kho thuốc</h2>
 <p class="mt-1 text-sm text-slate-500">Nguồn N3 - Pharmacy & Billing</p>
 </div>
 <Pill class="h-5 w-5 text-teal-600" />
 </div>
 <div class="mt-4 space-y-3">
 <div v-for="medicine in lowStockMedicines" :key="medicine.medicineId" class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
 <div>
 <p class="font-semibold text-slate-950">{{ medicine.medicineName }}</p>
 <p class="mt-1 text-xs text-slate-500">{{ medicine.dosageForm }}</p>
 </div>
 <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', medicine.stockQuantity === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700']">
 {{ medicine.stockQuantity }} tồn
 </span>
 </div>
 <p v-if="!lowStockMedicines.length" class="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">Kho thuốc chưa có cảnh báo tồn thấp.</p>
 </div>
 </div>

 <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
 <div class="flex items-center justify-between">
 <div>
 <h2 class="font-semibold text-slate-950">Bệnh nhân mới</h2>
 <p class="mt-1 text-sm text-slate-500">Nguồn N2 - Medical Record</p>
 </div>
 <UsersRound class="h-5 w-5 text-cyan-600" />
 </div>
 <div class="mt-4 space-y-3">
 <div v-for="patient in newestPatients" :key="patient.patientId" class="rounded-xl border border-slate-100 px-4 py-3">
 <p class="font-semibold text-slate-950">{{ displayText(patient.fullName) }}</p>
 <p class="mt-1 text-sm text-slate-500">{{ patient.phone || patient.phoneNumber || 'Chưa có số điện thoại' }}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import {
 AlertTriangle,
 CalendarCheck,
 ClipboardList,
 CreditCard,
 Database,
 FileHeart,
 Pill,
 RefreshCw,
 Stethoscope,
 UsersRound,
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import { medicineApi } from '@/services/medicineApi'
import { fallbackAppointments, fallbackDoctors, fallbackSpecialties } from '@/services/fallbackData'
import type { Appointment } from '@/types/appointment'
import type { Invoice } from '@/types/billing'
import type { Doctor, DoctorSchedule } from '@/types/doctor'
import type { MedicalRecord, Patient } from '@/types/medicalRecord'
import type { Medicine } from '@/types/medicine'
import type { Specialty } from '@/types/specialty'
import { displayText } from '@/utils/displayText'

type ServiceStatus = 'loading' | 'online' | 'mock' | 'fallback'

interface StatCard {
 label: string
 value: string | number
 note: string
 to: string
 icon: Component
 iconClass: string
}

const loading = ref(true)
const error = ref('')
const doctors = ref<Doctor[]>([])
const specialties = ref<Specialty[]>([])
const schedules = ref<DoctorSchedule[]>([])
const appointments = ref<Appointment[]>([])
const patients = ref<Patient[]>([])
const records = ref<MedicalRecord[]>([])
const medicines = ref<Medicine[]>([])
const invoices = ref<Invoice[]>([])
const serviceStatuses = ref<Record<'n1' | 'n2' | 'n3', ServiceStatus>>({
 n1: 'loading',
 n2: 'loading',
 n3: 'loading',
})

const isMockN3 = import.meta.env.VITE_USE_MOCK_N3 === 'true'

const fallbackSchedules: DoctorSchedule[] = fallbackDoctors.map((doctor, index) => ({
 scheduleId: 900 + index,
 doctorId: doctor.doctorId,
 doctorName: doctor.doctorName,
 workDate: addDays(index).toISOString().slice(0, 10),
 startTime: '08:00',
 endTime: index % 2 === 0 ? '16:00' : '12:00',
 slotDurationMinutes: 30,
 isAvailable: true,
}))

const fallbackPatients: Patient[] = [
 { patientId: 'BN001', fullName: 'Nguyễn Minh An', phone: '0901001001', gender: 'Male', medicalHistory: 'Tăng huyết áp', createdAt: new Date().toISOString() },
 { patientId: 'BN002', fullName: 'Trần Thu Hà', phone: '0902002002', gender: 'Female', medicalHistory: 'Dị ứng hải sản', createdAt: new Date().toISOString() },
 { patientId: 'BN003', fullName: 'Lê Bảo Châu', phone: '0903003003', gender: 'Female', medicalHistory: null, createdAt: new Date().toISOString() },
]

const fallbackMedicines: Medicine[] = [
 { medicineId: 1, medicineName: 'Paracetamol 500mg', dosageForm: 'Viên nén', unitPrice: 1500, stockQuantity: 200, isActive: true },
 { medicineId: 2, medicineName: 'Amoxicillin 500mg', dosageForm: 'Viên nang', unitPrice: 3500, stockQuantity: 18, isActive: true },
 { medicineId: 3, medicineName: 'Siro ho Eugica 100ml', dosageForm: 'Siro', unitPrice: 45000, stockQuantity: 0, isActive: true },
]

const fallbackInvoices: Invoice[] = [
 { invoiceId: 1001, appointmentId: 2201, patientId: 12, amount: 300000, status: 'Paid', createdAt: new Date().toISOString() },
 { invoiceId: 1002, appointmentId: 2202, patientId: 4, amount: 350000, status: 'Unpaid', createdAt: new Date().toISOString() },
]

const statCards = computed<StatCard[]>(() => [
 { label: 'Bác sĩ', value: doctors.value.length, note: 'Hồ sơ bác sĩ từ N1', to: '/admin/doctors', icon: Stethoscope, iconClass: 'bg-teal-50 text-teal-700' },
 { label: 'Lịch hẹn', value: appointments.value.length, note: 'Đặt lịch và hàng chờ', to: '/admin/appointments', icon: CalendarCheck, iconClass: 'bg-cyan-50 text-cyan-700' },
 { label: 'Bệnh nhân', value: patients.value.length, note: 'Hồ sơ bệnh nhân từ N2', to: '/admin/patients', icon: UsersRound, iconClass: 'bg-blue-50 text-blue-700' },
 { label: 'Doanh thu tạm tính', value: formatCurrency(totalRevenue.value), note: 'Hóa đơn đã thanh toán từ N3', to: '/admin/bills', icon: CreditCard, iconClass: 'bg-emerald-50 text-emerald-700' },
])

const totalRevenue = computed(() =>
 invoices.value
 .filter((invoice) => String(invoice.status).toLowerCase() === 'paid')
 .reduce((total, invoice) => total + Number(invoice.amount || 0), 0),
)

const serviceCards = computed(() => [
 {
 name: 'N1 Appointment Service',
 scope: `${doctors.value.length} bác sĩ · ${appointments.value.length} lịch hẹn`,
 status: serviceStatuses.value.n1,
 description: 'Quản lý chuyên khoa, bác sĩ, lịch làm việc, slot trống, lịch hẹn và hàng chờ khám.',
 endpoints: '/api/doctors, /api/specialties, /api/appointments',
 icon: ClipboardList,
 iconClass: 'bg-teal-50 text-teal-700',
 },
 {
 name: 'N2 Medical Record Service',
 scope: `${patients.value.length} bệnh nhân · ${records.value.length} bệnh án`,
 status: serviceStatuses.value.n2,
 description: 'Quản lý bệnh nhân, hồ sơ bệnh án, thông tin khám bệnh và dữ liệu chuẩn bị kê đơn.',
 endpoints: '/api/patients, /api/medical-records',
 icon: FileHeart,
 iconClass: 'bg-blue-50 text-blue-700',
 },
 {
 name: 'N3 Pharmacy & Billing Service',
 scope: `${medicines.value.length} thuốc · ${invoices.value.length} hóa đơn`,
 status: serviceStatuses.value.n3,
 description: 'Đăng nhập JWT, quản lý kho thuốc, hóa đơn, thanh toán và viện phí.',
 endpoints: '/api/auth, /api/medicines, /api/billing',
 icon: Database,
 iconClass: 'bg-emerald-50 text-emerald-700',
 },
])

const recentAppointments = computed(() => appointments.value.slice(0, 5))
const newestPatients = computed(() => patients.value.slice(0, 3))
const lowStockMedicines = computed(() => medicines.value.filter((medicine) => medicine.stockQuantity <= 20).slice(0, 4))

onMounted(loadDashboard)

async function loadDashboard() {
 loading.value = true
 error.value = ''
 serviceStatuses.value = { n1: 'loading', n2: 'loading', n3: 'loading' }

 const results = await Promise.allSettled([
 appointmentApi.getDoctors(),
 appointmentApi.getSpecialties(),
 appointmentApi.getDoctorSchedules(),
 appointmentApi.getAppointments(),
 medicalRecordApi.getPatients(),
 medicalRecordApi.getMedicalRecords(),
 medicineApi.getMedicines(),
 billingApi.getInvoices(),
 ])

 doctors.value = readList(results[0], fallbackDoctors)
 specialties.value = readList(results[1], fallbackSpecialties)
 schedules.value = readList(results[2], fallbackSchedules)
 appointments.value = readList(results[3], fallbackAppointments)
 patients.value = readList(results[4], fallbackPatients)
 records.value = readList(results[5], [])
 medicines.value = readList(results[6], fallbackMedicines)
 invoices.value = readList(results[7], fallbackInvoices)

 serviceStatuses.value.n1 = hasFulfilledData(results.slice(0, 4)) ? 'online' : 'fallback'
 serviceStatuses.value.n2 = hasFulfilledData(results.slice(4, 6)) ? 'online' : 'fallback'
 serviceStatuses.value.n3 = isMockN3 ? 'mock' : hasFulfilledData(results.slice(6, 8)) ? 'online' : 'fallback'

 const firstError = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined
 if (firstError) {
 error.value = `Một số API chưa phản hồi ổn định: ${getApiErrorMessage(firstError.reason)}. Dashboard đang dùng fallback cho phần thiếu dữ liệu.`
 }

 loading.value = false
}

function readList<T>(result: PromiseSettledResult<T[]>, fallback: T[]) {
 if (result.status === 'fulfilled' && Array.isArray(result.value) && result.value.length) {
 return result.value
 }
 return fallback
}

function hasFulfilledData(results: PromiseSettledResult<unknown>[]) {
 return results.some((result) => result.status === 'fulfilled')
}

function addDays(days: number) {
 const date = new Date()
 date.setDate(date.getDate() + days)
 return date
}

function formatCurrency(value: number) {
 return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDate(value?: string) {
 if (!value) return 'Chưa cập nhật'
 const date = new Date(value)
 if (Number.isNaN(date.getTime())) return value
 return new Intl.DateTimeFormat('vi-VN').format(date)
}

function serviceStatusLabel(status: ServiceStatus) {
 const labels: Record<ServiceStatus, string> = {
 loading: 'Đang kiểm tra',
 online: 'Đã kết nối',
 mock: 'Mock N3',
 fallback: 'Fallback',
 }
 return labels[status]
}

function serviceStatusClass(status: ServiceStatus) {
 const classes: Record<ServiceStatus, string> = {
 loading: 'bg-slate-100 text-slate-600',
 online: 'bg-teal-100 text-teal-700',
 mock: 'bg-blue-100 text-blue-700',
 fallback: 'bg-amber-100 text-amber-700',
 }
 return classes[status]
}

function statusClass(status?: string) {
 const value = String(status || '').toLowerCase()
 if (value.includes('paid') || value.includes('confirmed') || value.includes('completed') || value.includes('done')) return 'bg-teal-100 text-teal-700'
 if (value.includes('pending') || value.includes('waiting') || value.includes('unpaid')) return 'bg-amber-100 text-amber-700'
 if (value.includes('cancel')) return 'bg-rose-100 text-rose-700'
 return 'bg-slate-100 text-slate-700'
}
</script>