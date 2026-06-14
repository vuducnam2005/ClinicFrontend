<template>
  <section class="min-h-screen bg-[#f8fafc] py-3">
    <FullscreenLoader :show="loading" />

    <div class="mx-auto max-w-none space-y-5 px-4 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-[1.8rem] font-bold leading-tight tracking-normal text-slate-950">Bảng điều khiển vận hành</h1>
          <p class="mt-1.5 text-[13px] font-medium leading-5 text-slate-500">
            Theo dõi lịch khám, doanh thu, bệnh nhân, bác sĩ và kho thuốc trong một màn hình tổng quan.
          </p>
        </div>
        <button
          type="button"
          :disabled="loading"
          class="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0F52BA] disabled:cursor-not-allowed disabled:opacity-60"
          @click="loadDashboard"
        >
          <RefreshCw :class="['h-4 w-4', loading ? 'animate-spin' : '']" />
          Tải lại dữ liệu
        </button>
      </header>

      <div v-if="error" class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0" />
        <span>{{ error }}</span>
      </div>

      <template v-if="!loading">
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RouterLink
            v-for="metric in kpiCards"
            :key="metric.label"
            :to="metric.to"
            class="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-[0_14px_34px_rgba(15,82,186,0.12)]"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-xs font-semibold text-slate-500">{{ metric.label }}</p>
                <p class="mt-2 truncate text-2xl font-bold text-slate-950">{{ metric.value }}</p>
                <p class="mt-1 text-xs font-medium text-slate-400">{{ metric.note }}</p>
              </div>
              <span :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105', metric.iconClass]">
                <component :is="metric.icon" class="h-5 w-5" />
              </span>
            </div>
          </RouterLink>
        </section>

        <section class="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-lg font-bold text-slate-950">Xu hướng 7 ngày</h2>
                <p class="mt-1 text-sm text-slate-500">Lịch hẹn và bệnh án phát sinh theo ngày.</p>
              </div>
              <div class="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-[#0F52BA]"></span>Lịch hẹn</span>
                <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>Bệnh án</span>
              </div>
            </div>
            <LineChart class="mt-5" :labels="trendLabels" :series="trendSeries" />
          </div>

          <div class="grid gap-5">
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-lg font-bold text-slate-950">Trạng thái lịch hẹn</h2>
                  <p class="mt-1 text-sm text-slate-500">Tỷ trọng theo trạng thái hiện tại.</p>
                </div>
                <CalendarClock class="h-5 w-5 text-[#0F52BA]" />
              </div>
              <div class="mt-5 grid gap-5 sm:grid-cols-[160px_1fr] sm:items-center">
                <DoughnutChart :segments="appointmentStatusSegments" :total="appointments.length" />
                <div class="space-y-2">
                  <div v-for="segment in appointmentStatusSegments" :key="segment.label" class="flex items-center justify-between gap-3 text-sm">
                    <span class="inline-flex min-w-0 items-center gap-2 text-slate-600">
                      <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: segment.color }"></span>
                      <span class="truncate">{{ segment.label }}</span>
                    </span>
                    <span class="font-medium text-slate-900">{{ segment.value }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-lg font-bold text-slate-950">Tình trạng dịch vụ</h2>
                  <p class="mt-1 text-sm text-slate-500">Theo dõi nguồn dữ liệu N1, N2, N3.</p>
                </div>
                <ServerCog class="h-5 w-5 text-slate-500" />
              </div>
              <div class="mt-4 space-y-2.5">
                <div v-for="service in serviceCards" :key="service.name" class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-800">{{ service.name }}</p>
                    <p class="mt-0.5 text-xs text-slate-400">{{ service.scope }}</p>
                  </div>
                  <span :class="['shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', serviceStatusClass(service.status)]">
                    {{ serviceStatusLabel(service.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <TableHeader title="Lịch hẹn gần đây" subtitle="Các lịch mới nhất trong hệ thống." to="/admin/appointments" action="Xem tất cả" />
            <div class="overflow-x-auto">
              <table class="min-w-full text-left text-[13px]">
                <thead class="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <tr>
                    <th class="px-4 py-2.5">Mã</th>
                    <th class="px-4 py-2.5">Bệnh nhân</th>
                    <th class="px-4 py-2.5">Bác sĩ</th>
                    <th class="px-4 py-2.5">Ngày giờ</th>
                    <th class="px-4 py-2.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="appointment in recentAppointments" :key="appointment.appointmentId" class="hover:bg-slate-50/80">
                    <td class="px-4 py-3 font-mono text-xs font-semibold text-[#0F52BA]">{{ appointmentCode(appointment) }}</td>
                    <td class="px-4 py-3">
                      <p class="font-medium text-slate-900">{{ displayText(appointment.patientName) }}</p>
                      <p class="mt-0.5 text-xs text-slate-400">{{ appointment.patientPhone || 'Chưa có SĐT' }}</p>
                    </td>
                    <td class="px-4 py-3 text-slate-600">{{ displayText(appointment.doctorName) }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-slate-600">
                      <span class="font-medium text-slate-700">{{ formatDate(appointment.appointmentDate) }}</span>
                      <span class="ml-2 text-xs text-slate-400">{{ timeLabel(appointment) }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', appointmentStatusClass(appointment.status)]">
                        {{ appointmentStatusLabel(appointment.status) }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!recentAppointments.length">
                    <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-500">Chưa có lịch hẹn để hiển thị.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid gap-5">
            <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <TableHeader title="Cảnh báo kho thuốc" subtitle="Thuốc hết hoặc sắp dưới ngưỡng tồn." to="/admin/medicines" action="Xem kho" />
              <div class="divide-y divide-slate-100">
                <div v-for="medicine in lowStockMedicines" :key="medicine.medicineId" class="flex items-center justify-between gap-3 px-4 py-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-900">{{ medicine.medicineName }}</p>
                    <p class="mt-0.5 text-xs text-slate-400">{{ medicine.dosageForm || medicine.unit || 'Chưa cập nhật dạng thuốc' }}</p>
                  </div>
                  <span :class="['shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', medicineStockClass(medicine)]">
                    {{ medicine.stockQuantity }} tồn
                  </span>
                </div>
                <div v-if="!lowStockMedicines.length" class="px-4 py-6 text-center text-sm text-emerald-700">
                  Kho thuốc chưa có cảnh báo tồn thấp.
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <TableHeader title="Bệnh nhân mới" subtitle="Hồ sơ đăng ký gần đây." to="/admin/patients" action="Xem bệnh nhân" />
              <div class="divide-y divide-slate-100">
                <div v-for="patient in newestPatients" :key="patient.patientId" class="flex items-center justify-between gap-3 px-4 py-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-900">{{ displayText(patient.fullName) }}</p>
                    <p class="mt-0.5 text-xs text-slate-400">{{ patient.phone || patient.phoneNumber || 'Chưa có số điện thoại' }}</p>
                  </div>
                  <span class="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">{{ patient.patientCode || patient.patientIdCode || patient.patientId }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold text-slate-950">Doanh thu</h2>
                <p class="mt-1 text-sm text-slate-500">Đã thanh toán so với tổng hóa đơn.</p>
              </div>
              <WalletCards class="h-5 w-5 text-emerald-700" />
            </div>
            <div class="mt-5">
              <div class="flex items-end justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold text-slate-400">Đã thu</p>
                  <p class="mt-1 text-2xl font-bold text-emerald-700">{{ formatCurrency(totalRevenue) }}</p>
                </div>
                <p class="text-sm font-semibold text-slate-500">{{ revenuePaidPercent }}%</p>
              </div>
              <div class="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${revenuePaidPercent}%` }"></div>
              </div>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-slate-50 p-3">
                  <p class="text-xs font-semibold text-slate-400">Tổng hóa đơn</p>
                  <p class="mt-1 font-bold text-slate-950">{{ formatCurrency(invoiceTotal) }}</p>
                </div>
                <div class="rounded-xl bg-amber-50 p-3">
                  <p class="text-xs font-semibold text-amber-700">Chưa thu</p>
                  <p class="mt-1 font-bold text-amber-800">{{ formatCurrency(unpaidRevenue) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <TableHeader title="Hóa đơn gần đây" subtitle="Tình trạng thanh toán mới nhất." to="/admin/bills" action="Xem hóa đơn" />
            <div class="overflow-x-auto">
              <table class="min-w-full text-left text-[13px]">
                <thead class="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <tr>
                    <th class="px-4 py-2.5">Mã HĐ</th>
                    <th class="px-4 py-2.5">Lịch hẹn</th>
                    <th class="px-4 py-2.5">Số tiền</th>
                    <th class="px-4 py-2.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="invoice in recentInvoices" :key="invoiceKey(invoice)" class="hover:bg-slate-50/80">
                    <td class="px-4 py-3 font-mono text-xs font-semibold text-[#0F52BA]">{{ invoiceCode(invoice) }}</td>
                    <td class="px-4 py-3 text-slate-600">{{ appointmentInvoiceLabel(invoice) }}</td>
                    <td class="px-4 py-3 font-semibold text-slate-900">{{ formatCurrency(invoiceAmount(invoice)) }}</td>
                    <td class="px-4 py-3">
                      <span :class="['rounded-full px-2.5 py-1 text-xs font-medium', invoiceStatusClass(invoice.status)]">{{ invoiceStatusLabel(invoice.status) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component, type PropType } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  FileHeart,
  Pill,
  RefreshCw,
  ServerCog,
  Stethoscope,
  UsersRound,
  WalletCards,
} from 'lucide-vue-next'
import FullscreenLoader from '@/components/ui/FullscreenLoader.vue'
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

type ServiceStatus = 'loading' | 'online' | 'fallback'
type ChartSeries = { name: string; color: string; fill: string; data: number[] }
type StatusSegment = { label: string; color: string; value: number }

interface KpiCard {
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
  { patientId: 'BN001', patientCode: 'BN001', fullName: 'Nguyễn Minh An', phone: '0901001001', gender: 'Male', medicalHistory: 'Tăng huyết áp', createdAt: new Date().toISOString() },
  { patientId: 'BN002', patientCode: 'BN002', fullName: 'Trần Thu Hà', phone: '0902002002', gender: 'Female', medicalHistory: 'Dị ứng hải sản', createdAt: new Date().toISOString() },
  { patientId: 'BN003', patientCode: 'BN003', fullName: 'Lê Bảo Châu', phone: '0903003003', gender: 'Female', medicalHistory: null, createdAt: new Date().toISOString() },
]

const fallbackMedicines: Medicine[] = [
  { medicineId: 1, medicineName: 'Paracetamol 500mg', dosageForm: 'Viên nén', unitPrice: 1500, stockQuantity: 200, minStockLevel: 30, isActive: true },
  { medicineId: 2, medicineName: 'Amoxicillin 500mg', dosageForm: 'Viên nang', unitPrice: 3500, stockQuantity: 18, minStockLevel: 30, isActive: true },
  { medicineId: 3, medicineName: 'Siro ho Eugica 100ml', dosageForm: 'Siro', unitPrice: 45000, stockQuantity: 0, minStockLevel: 20, isActive: true },
]

const fallbackInvoices: Invoice[] = [
  { invoiceId: 1001, appointmentId: 2201, patientId: 12, amount: 300000, status: 'Paid', createdAt: new Date().toISOString() },
  { invoiceId: 1002, appointmentId: 2202, patientId: 4, amount: 350000, status: 'Unpaid', createdAt: new Date().toISOString() },
]

const todayKey = computed(() => normalizeDateOnly(new Date().toISOString()))
const todayAppointments = computed(() => appointments.value.filter(item => normalizeDateOnly(item.appointmentDate) === todayKey.value))
const completedAppointments = computed(() => appointments.value.filter(item => appointmentStatusLabel(item.status) === 'Hoàn tất').length)
const lowStockMedicines = computed(() => medicines.value.filter(isLowStockMedicine).slice(0, 5))
const recentAppointments = computed(() => [...appointments.value].sort((a, b) => dateTimestamp(b.createdAt || b.appointmentDate) - dateTimestamp(a.createdAt || a.appointmentDate)).slice(0, 5))
const newestPatients = computed(() => [...patients.value].sort((a, b) => dateTimestamp(b.createdAt) - dateTimestamp(a.createdAt)).slice(0, 4))
const recentInvoices = computed(() => [...invoices.value].sort((a, b) => dateTimestamp(b.createdAt || b.paidAt) - dateTimestamp(a.createdAt || a.paidAt)).slice(0, 5))

const invoiceTotal = computed(() => invoices.value.reduce((sum, invoice) => sum + invoiceAmount(invoice), 0))
const totalRevenue = computed(() => invoices.value.reduce((sum, invoice) => sum + invoicePaidAmount(invoice), 0))
const unpaidRevenue = computed(() => Math.max(invoiceTotal.value - totalRevenue.value, 0))
const revenuePaidPercent = computed(() => invoiceTotal.value > 0 ? Math.min(100, Math.round((totalRevenue.value / invoiceTotal.value) * 100)) : 0)

const kpiCards = computed<KpiCard[]>(() => [
  {
    label: 'Lịch hôm nay',
    value: todayAppointments.value.length,
    note: `${completedAppointments.value} lịch đã hoàn tất`,
    to: '/admin/appointments',
    icon: CalendarCheck,
    iconClass: 'bg-blue-50 text-[#0F52BA]',
  },
  {
    label: 'Bệnh nhân',
    value: patients.value.length,
    note: `${newestPatients.value.length} hồ sơ mới gần đây`,
    to: '/admin/patients',
    icon: UsersRound,
    iconClass: 'bg-cyan-50 text-cyan-700',
  },
  {
    label: 'Bác sĩ',
    value: doctors.value.length,
    note: `${specialties.value.length} chuyên khoa · ${schedules.value.length} lịch làm`,
    to: '/admin/doctors',
    icon: Stethoscope,
    iconClass: 'bg-indigo-50 text-indigo-700',
  },
  {
    label: 'Doanh thu đã thu',
    value: formatCurrency(totalRevenue.value),
    note: `${invoices.value.length} hóa đơn trong hệ thống`,
    to: '/admin/bills',
    icon: WalletCards,
    iconClass: 'bg-emerald-50 text-emerald-700',
  },
])

const trendDays = computed(() => lastDays(7))
const trendLabels = computed(() => trendDays.value.map(day => day.label))
const trendSeries = computed<ChartSeries[]>(() => [
  {
    name: 'Lịch hẹn',
    color: '#0F52BA',
    fill: 'rgba(15, 82, 186, 0.16)',
    data: trendDays.value.map(day => countByDate(appointments.value, item => item.appointmentDate || item.createdAt, day.key)),
  },
  {
    name: 'Bệnh án',
    color: '#10b981',
    fill: 'rgba(16, 185, 129, 0.14)',
    data: trendDays.value.map(day => countByDate(records.value, item => item.examDate || item.createdAt || item.completedAt, day.key)),
  },
])

const appointmentStatusSegments = computed<StatusSegment[]>(() => {
  if (!appointments.value.length) return [{ label: 'Chưa có dữ liệu', value: 1, color: '#e2e8f0' }]

  const groups = new Map<string, StatusSegment>()
  appointments.value.forEach((appointment) => {
    const label = appointmentStatusLabel(appointment.status)
    const current = groups.get(label) || { label, value: 0, color: appointmentStatusColor(appointment.status) }
    current.value += 1
    groups.set(label, current)
  })

  return Array.from(groups.values()).sort((a, b) => b.value - a.value)
})

const serviceCards = computed(() => [
  {
    name: 'N1 Appointment',
    scope: `${doctors.value.length} bác sĩ · ${appointments.value.length} lịch hẹn`,
    status: serviceStatuses.value.n1,
  },
  {
    name: 'N2 Medical',
    scope: `${patients.value.length} bệnh nhân · ${records.value.length} bệnh án`,
    status: serviceStatuses.value.n2,
  },
  {
    name: 'N3 Billing',
    scope: `${medicines.value.length} thuốc · ${invoices.value.length} hóa đơn`,
    status: serviceStatuses.value.n3,
  },
])

const TableHeader = defineComponent({
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    to: { type: String, required: true },
    action: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'flex flex-col gap-2.5 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between' }, [
      h('div', [
        h('h2', { class: 'text-base font-bold text-slate-950' }, props.title),
        h('p', { class: 'mt-0.5 text-xs text-slate-500' }, props.subtitle),
      ]),
      h(RouterLink, { to: props.to, class: 'inline-flex items-center gap-1 text-xs font-bold text-[#003c90] hover:text-[#0F52BA]' }, {
        default: () => [props.action, h(ChevronRight, { class: 'h-4 w-4' })],
      }),
    ])
  },
})

const LineChart = defineComponent({
  props: {
    labels: { type: Array as PropType<string[]>, required: true },
    series: { type: Array as PropType<ChartSeries[]>, required: true },
  },
  setup(props, { attrs }) {
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    let observer: ResizeObserver | null = null

    const draw = () => drawLineChart(canvasRef.value, props.labels, props.series)

    onMounted(() => {
      nextTick(draw)
      if (canvasRef.value && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(draw)
        observer.observe(canvasRef.value)
      }
    })
    onBeforeUnmount(() => observer?.disconnect())
    watch(() => [props.labels, props.series], () => nextTick(draw), { deep: true })

    return () => h('div', { ...attrs, class: ['rounded-xl border border-slate-100 bg-slate-50/60 p-3', attrs.class] }, [
      h('canvas', { ref: canvasRef, class: 'h-[30rem] w-full' }),
    ])
  },
})

const DoughnutChart = defineComponent({
  props: {
    segments: { type: Array as PropType<StatusSegment[]>, required: true },
    total: { type: Number, required: true },
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    let observer: ResizeObserver | null = null

    const draw = () => drawDoughnutChart(canvasRef.value, props.segments, props.total)

    onMounted(() => {
      nextTick(draw)
      if (canvasRef.value && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(draw)
        observer.observe(canvasRef.value)
      }
    })
    onBeforeUnmount(() => observer?.disconnect())
    watch(() => [props.segments, props.total], () => nextTick(draw), { deep: true })

    return () => h('canvas', { ref: canvasRef, class: 'h-40 w-40' })
  },
})

onMounted(loadDashboard)

async function loadDashboard() {
  loading.value = true
  error.value = ''
  serviceStatuses.value = { n1: 'loading', n2: 'loading', n3: 'loading' }

  try {
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
    serviceStatuses.value.n3 = hasFulfilledData(results.slice(6, 8)) ? 'online' : 'fallback'

    const firstError = results.find(result => result.status === 'rejected') as PromiseRejectedResult | undefined
    if (firstError) {
      error.value = `Không thể kết nối đến máy chủ để lấy một số dữ liệu: ${getApiErrorMessage(firstError.reason)}. Hệ thống đang hiển thị dữ liệu lưu trữ tạm thời.`
    }
  } catch (err) {
    serviceStatuses.value = { n1: 'fallback', n2: 'fallback', n3: 'fallback' }
    doctors.value = fallbackDoctors
    specialties.value = fallbackSpecialties
    schedules.value = fallbackSchedules
    appointments.value = fallbackAppointments
    patients.value = fallbackPatients
    records.value = []
    medicines.value = fallbackMedicines
    invoices.value = fallbackInvoices
    error.value = `Không thể tải dashboard: ${getApiErrorMessage(err)}. Hệ thống đang hiển thị dữ liệu lưu trữ tạm thời.`
  } finally {
    loading.value = false
  }
}

function readList<T>(result: PromiseSettledResult<T[]>, fallback: T[]) {
  if (result.status === 'fulfilled' && Array.isArray(result.value) && result.value.length) return result.value
  return fallback
}

function hasFulfilledData(results: PromiseSettledResult<unknown>[]) {
  return results.some(result => result.status === 'fulfilled')
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

function lastDays(count: number) {
  const formatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (count - 1 - index))
    return {
      key: normalizeDateOnly(date.toISOString()),
      label: formatter.format(date),
    }
  })
}

function countByDate<T>(items: T[], dateGetter: (item: T) => unknown, dateKey: string) {
  return items.filter(item => normalizeDateOnly(dateGetter(item)) === dateKey).length
}

function appointmentCode(appointment: Appointment & Record<string, any>) {
  return appointment.appointmentCode || `LH${String(appointment.appointmentId || '').padStart(3, '0')}`
}

function invoiceKey(invoice: Invoice & Record<string, any>) {
  return String(invoice.invoiceId || invoice.id || invoice.invoiceCode || invoice.createdAt || Math.random())
}

function invoiceCode(invoice: Invoice & Record<string, any>) {
  const code = invoice.invoiceCode || invoice.invoiceIdCode || invoice.InvoiceCode || invoice.InvoiceIdCode
  if (code) return String(code)
  const id = invoice.invoiceId || invoice.id
  return id ? `HĐ${String(id).padStart(3, '0')}` : 'HĐ'
}

function appointmentInvoiceLabel(invoice: Invoice & Record<string, any>) {
  const id = invoice.appointmentId || invoice.AppointmentId
  return id ? `LH${String(id).padStart(3, '0')}` : '-'
}

function invoiceAmount(invoice: Invoice & Record<string, any>) {
  return toNumber(invoice.totalAmount, invoice.TotalAmount, invoice.amount, invoice.Amount, invoice.examinationFee, invoice.ExaminationFee, invoice.examFee, invoice.ExamFee)
}

function invoicePaidAmount(invoice: Invoice & Record<string, any>) {
  const explicit = toNumber(invoice.paidAmount, invoice.PaidAmount)
  if (explicit > 0) return explicit
  const payments = Array.isArray(invoice.payments) ? invoice.payments : Array.isArray(invoice.Payments) ? invoice.Payments : []
  const paymentTotal = payments.reduce((sum: number, payment: Record<string, any>) => sum + toNumber(payment.amount, payment.Amount), 0)
  if (paymentTotal > 0) return paymentTotal
  if (invoiceStatusLabel(invoice.status) === 'Đã thanh toán') return invoiceAmount(invoice)
  return 0
}

function isLowStockMedicine(medicine: Medicine) {
  const minStock = Number(medicine.minStockLevel ?? 20)
  return Number(medicine.stockQuantity || 0) <= minStock
}

function medicineStockClass(medicine: Medicine) {
  if (Number(medicine.stockQuantity || 0) <= 0) return 'bg-rose-50 text-rose-700 border border-rose-100'
  return 'bg-amber-50 text-amber-700 border border-amber-100'
}

function timeLabel(appointment: Appointment & Record<string, any>) {
  return String(appointment.slotTime || appointment.SlotTime || '--:--').slice(0, 5)
}

function normalizeDateOnly(value: unknown) {
  const text = String(value || '').trim()
  if (!text) return ''
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  const viMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (viMatch) return `${viMatch[3]}-${viMatch[2].padStart(2, '0')}-${viMatch[1].padStart(2, '0')}`
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

function dateTimestamp(value: unknown) {
  const timestamp = new Date(String(value || '')).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function toNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value)
    if (Number.isFinite(numberValue) && numberValue > 0) return numberValue
  }
  return 0
}

function normalizeText(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0))
}

function formatDate(value?: unknown) {
  if (!value) return 'Chưa cập nhật'
  const text = String(value)
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : new Intl.DateTimeFormat('vi-VN').format(date)
}

function serviceStatusLabel(status: ServiceStatus) {
  const labels: Record<ServiceStatus, string> = {
    loading: 'Đang kiểm tra',
    online: 'Đã kết nối',
    fallback: 'Dữ liệu tạm',
  }
  return labels[status]
}

function serviceStatusClass(status: ServiceStatus) {
  const classes: Record<ServiceStatus, string> = {
    loading: 'bg-slate-100 text-slate-600',
    online: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    fallback: 'bg-amber-50 text-amber-700 border border-amber-100',
  }
  return classes[status]
}

function appointmentStatusLabel(status?: string) {
  const value = normalizeText(status)
  if (value.includes('checked') || value.includes('check-in')) return 'Đã check-in'
  if (value.includes('progress') || value.includes('dang kham')) return 'Đang khám'
  if (value.includes('confirmed') || value.includes('xac nhan')) return 'Đã xác nhận'
  if (value.includes('completed') || value.includes('done') || value.includes('hoan tat')) return 'Hoàn tất'
  if (value.includes('noshow') || value.includes('no show')) return 'Không đến khám'
  if (value.includes('expired') || value.includes('qua han')) return 'Đã quá hạn'
  if (value.includes('pending') || value.includes('waiting') || value.includes('cho')) return 'Đang chờ'
  if (value.includes('cancel') || value.includes('huy')) return 'Đã hủy'
  return status || 'Chưa cập nhật'
}

function appointmentStatusClass(status?: string) {
  const value = normalizeText(status)
  if (value.includes('cancel') || value.includes('huy')) return 'bg-rose-50 text-rose-700 border border-rose-100'
  if (value.includes('completed') || value.includes('done') || value.includes('hoan tat')) return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
  if (value.includes('progress') || value.includes('dang kham')) return 'bg-indigo-50 text-indigo-700 border border-indigo-100'
  if (value.includes('checked') || value.includes('check-in')) return 'bg-cyan-50 text-cyan-700 border border-cyan-100'
  if (value.includes('confirmed') || value.includes('xac nhan')) return 'bg-blue-50 text-blue-700 border border-blue-100'
  if (value.includes('pending') || value.includes('waiting') || value.includes('cho')) return 'bg-amber-50 text-amber-700 border border-amber-100'
  return 'bg-slate-50 text-slate-700 border border-slate-100'
}

function appointmentStatusColor(status?: string) {
  const value = normalizeText(status)
  if (value.includes('cancel') || value.includes('huy')) return '#f43f5e'
  if (value.includes('completed') || value.includes('done') || value.includes('hoan tat')) return '#10b981'
  if (value.includes('progress') || value.includes('dang kham')) return '#6366f1'
  if (value.includes('checked') || value.includes('check-in')) return '#06b6d4'
  if (value.includes('confirmed') || value.includes('xac nhan')) return '#0F52BA'
  if (value.includes('pending') || value.includes('waiting') || value.includes('cho')) return '#f59e0b'
  return '#94a3b8'
}

function invoiceStatusLabel(status?: string) {
  const value = normalizeText(status)
  if (value.includes('paid') || value.includes('da thanh toan')) return 'Đã thanh toán'
  if (value.includes('cancel') || value.includes('huy')) return 'Đã hủy'
  return 'Chưa thanh toán'
}

function invoiceStatusClass(status?: string) {
  const label = invoiceStatusLabel(status)
  if (label === 'Đã thanh toán') return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
  if (label === 'Đã hủy') return 'bg-rose-50 text-rose-700 border border-rose-100'
  return 'bg-amber-50 text-amber-700 border border-amber-100'
}

function drawLineChart(canvas: HTMLCanvasElement | null, labels: string[], series: ChartSeries[]) {
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const width = Math.max(rect.width, 320)
  const height = Math.max(rect.height, 260)
  canvas.width = width * dpr
  canvas.height = height * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const padding = { top: 24, right: 18, bottom: 38, left: 42 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(1, ...series.flatMap(item => item.data))
  const yMax = Math.max(1, Math.ceil(maxValue * 1.15))

  ctx.font = '11px Inter, ui-sans-serif, system-ui'
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 8])

  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + (chartHeight / 4) * index
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()
  }
  ctx.setLineDash([])

  ctx.fillStyle = '#64748b'
  labels.forEach((label, index) => {
    const x = padding.left + (labels.length > 1 ? (chartWidth / (labels.length - 1)) * index : chartWidth / 2)
    ctx.textAlign = 'center'
    ctx.fillText(label, x, height - 12)
  })

  series.forEach((item) => {
    const points = item.data.map((value, index) => ({
      x: padding.left + (labels.length > 1 ? (chartWidth / (labels.length - 1)) * index : chartWidth / 2),
      y: padding.top + chartHeight - (value / yMax) * chartHeight,
      value,
    }))

    const path = new Path2D()
    points.forEach((point, index) => {
      if (index === 0) path.moveTo(point.x, point.y)
      else {
        const previous = points[index - 1]
        const distance = point.x - previous.x
        path.bezierCurveTo(previous.x + distance * 0.45, previous.y, point.x - distance * 0.45, point.y, point.x, point.y)
      }
    })

    const area = new Path2D(path)
    const first = points[0]
    const last = points[points.length - 1]
    if (first && last) {
      area.lineTo(last.x, padding.top + chartHeight)
      area.lineTo(first.x, padding.top + chartHeight)
      area.closePath()
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
      gradient.addColorStop(0, item.fill)
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gradient
      ctx.fill(area)
    }

    ctx.strokeStyle = item.color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke(path)

    points.forEach((point) => {
      ctx.beginPath()
      ctx.fillStyle = '#fff'
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = item.color
      ctx.arc(point.x, point.y, 3.5, 0, Math.PI * 2)
      ctx.fill()
    })
  })
}

function drawDoughnutChart(canvas: HTMLCanvasElement | null, segments: StatusSegment[], total: number) {
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const size = Math.max(Math.min(rect.width || 160, rect.height || 160), 120)
  canvas.width = size * dpr
  canvas.height = size * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size, size)

  const center = size / 2
  const radius = size / 2 - 12
  const lineWidth = 22
  const totalValue = Math.max(segments.reduce((sum, item) => sum + item.value, 0), 1)
  let start = -Math.PI / 2

  segments.forEach((segment) => {
    const angle = (segment.value / totalValue) * Math.PI * 2
    ctx.beginPath()
    ctx.strokeStyle = segment.color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.arc(center, center, radius, start, start + angle)
    ctx.stroke()
    start += angle
  })

  ctx.beginPath()
  ctx.fillStyle = '#fff'
  ctx.arc(center, center, radius - lineWidth / 1.45, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#020617'
  ctx.font = '700 24px Inter, ui-sans-serif, system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(total || 0), center, center - 4)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '500 11px Inter, ui-sans-serif, system-ui'
  ctx.fillText('lịch hẹn', center, center + 18)
}
</script>
