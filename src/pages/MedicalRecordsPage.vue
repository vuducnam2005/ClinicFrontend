<template>
  <section class="min-h-screen bg-slate-50 py-8">
    <div class="container-page space-y-6">
      <div class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex gap-4">
            <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FileHeart class="h-6 w-6" />
            </span>
            <div>
              <p class="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">N2 Medical</p>
              <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Hồ sơ bệnh án</h1>
              <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Dữ liệu lấy trực tiếp từ Medical Service qua API Gateway: bệnh nhân, lượt khám, bệnh án và đơn thuốc điều trị.
              </p>
            </div>
          </div>
          <BaseButton variant="outline" :disabled="loading" @click="loadData">
            <template #icon><RefreshCw class="h-4 w-4" /></template>
            Tải lại
          </BaseButton>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-4">
        <BaseCard class="p-5">
          <p class="text-sm font-medium text-slate-500">Trạng thái N2</p>
          <div class="mt-3 flex items-center gap-2">
            <span :class="['h-2.5 w-2.5 rounded-full', healthOk ? 'bg-emerald-500' : 'bg-rose-500']"></span>
            <p class="font-bold text-slate-950">{{ healthOk ? 'Đang hoạt động' : 'Cần kiểm tra' }}</p>
          </div>
        </BaseCard>
        <BaseCard class="p-5">
          <p class="text-sm font-medium text-slate-500">Bệnh nhân</p>
          <p class="mt-3 text-3xl font-bold text-slate-950">{{ patients.length }}</p>
        </BaseCard>
        <BaseCard class="p-5">
          <p class="text-sm font-medium text-slate-500">Lượt khám</p>
          <p class="mt-3 text-3xl font-bold text-slate-950">{{ selectedHistory.visits.length }}</p>
        </BaseCard>
        <BaseCard class="p-5">
          <p class="text-sm font-medium text-slate-500">Bệnh án</p>
          <p class="mt-3 text-3xl font-bold text-slate-950">{{ selectedHistory.medicalRecords.length }}</p>
        </BaseCard>
      </div>

      <div v-if="error" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {{ error }}
      </div>

      <div class="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section class="rounded-2xl border border-slate-200 bg-white shadow-card">
          <div class="border-b border-slate-100 p-4">
            <label class="relative block">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="patientQuery"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Tìm bệnh nhân..."
              />
            </label>
          </div>

          <div v-if="loading" class="space-y-3 p-4">
            <LoadingSkeleton v-for="item in 4" :key="item" />
          </div>
          <div v-else-if="filteredPatients.length" class="max-h-[720px] overflow-y-auto p-3">
            <button
              v-for="patient in filteredPatients"
              :key="patientKey(patient)"
              type="button"
              :class="[
                'mb-2 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
                String(selectedPatientId) === patientKey(patient)
                  ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-50'
                  : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
              ]"
              @click="selectPatient(patient)"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <UserRound class="h-5 w-5" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate font-bold text-slate-950">{{ displayText(patient.fullName) }}</span>
                <span class="mt-1 block truncate text-sm text-slate-500">{{ patient.phone || patient.phoneNumber || 'Chưa có số điện thoại' }}</span>
                <span class="mt-1 block text-xs font-semibold text-blue-700">Mã bệnh nhân: {{ patientKey(patient) }}</span>
              </span>
            </button>
          </div>
          <div v-else class="p-8 text-center">
            <UsersRound class="mx-auto h-10 w-10 text-slate-300" />
            <h2 class="mt-4 font-bold text-slate-950">Không có bệnh nhân</h2>
            <p class="mt-2 text-sm text-slate-500">N2 chưa trả dữ liệu bệnh nhân phù hợp.</p>
          </div>
        </section>

        <section class="space-y-5">
          <BaseCard class="p-5">
            <template v-if="selectedPatient">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p class="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Bệnh nhân đang chọn</p>
                  <h2 class="mt-2 text-2xl font-bold text-slate-950">{{ displayText(selectedPatient.fullName) }}</h2>
                </div>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">#{{ patientKey(selectedPatient) }}</span>
              </div>
              <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem label="Giới tính" :value="genderLabel(selectedPatient.gender)" />
                <InfoItem label="Ngày sinh" :value="formatDate(selectedPatient.dateOfBirth)" />
                <InfoItem label="Điện thoại" :value="selectedPatient.phone || selectedPatient.phoneNumber || 'Chưa cập nhật'" />
                <InfoItem label="Tiền sử bệnh" :value="selectedPatient.medicalHistory || 'Chưa ghi nhận'" class="lg:col-span-3" />
              </dl>
            </template>
            <p v-else class="text-sm text-slate-500">Chọn một bệnh nhân để xem hồ sơ bệnh án.</p>
          </BaseCard>

          <div v-if="historyLoading" class="grid gap-4 md:grid-cols-2">
            <LoadingSkeleton v-for="item in 4" :key="item" />
          </div>

          <template v-else>
            <RecordSection title="Lượt khám" :count="selectedHistory.visits.length" icon-class="bg-cyan-50 text-cyan-700">
              <template #icon><ClipboardList class="h-5 w-5" /></template>
              <div v-if="selectedHistory.visits.length" class="overflow-hidden rounded-xl border border-slate-200">
                <table class="min-w-full divide-y divide-slate-100 text-sm">
                  <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-3">Visit ID</th>
                      <th class="px-4 py-3">Lịch hẹn</th>
                      <th class="px-4 py-3">Trạng thái</th>
                      <th class="px-4 py-3">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="visit in selectedHistory.visits" :key="String(visit.visitId || visit.id)">
                      <td class="px-4 py-3 font-semibold text-slate-950">{{ visit.visitId || visit.id || '-' }}</td>
                      <td class="px-4 py-3 text-slate-600">{{ visit.appointmentId || '-' }}</td>
                      <td class="px-4 py-3"><StatusBadge :status="visit.status" /></td>
                      <td class="px-4 py-3 text-slate-600">{{ formatDateTime(visit.checkedInAt || visit.createdAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <EmptyState v-else text="Bệnh nhân này chưa có lượt khám trong N2." />
            </RecordSection>

            <RecordSection title="Bệnh án & chẩn đoán" :count="selectedHistory.medicalRecords.length" icon-class="bg-blue-50 text-blue-700">
              <template #icon><FileHeart class="h-5 w-5" /></template>
              <div v-if="selectedHistory.medicalRecords.length" class="grid gap-3">
                <BaseCard v-for="record in selectedHistory.medicalRecords" :key="record.medicalRecordId || record.id" class="p-4">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p class="font-bold text-slate-950">{{ record.diagnosisText || record.diagnosis || 'Chưa có chẩn đoán' }}</p>
                      <p class="mt-1 text-sm text-slate-500">Visit #{{ record.visitId || '-' }} · {{ formatDateTime(record.examDate || record.createdAt) }}</p>
                    </div>
                    <StatusBadge :status="record.status" />
                  </div>
                  <p v-if="record.diagnosisCode" class="mt-3 text-sm font-semibold text-blue-700">ICD: {{ record.diagnosisCode }}</p>
                  <p v-if="record.doctorNote || record.doctorNotes" class="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {{ record.doctorNote || record.doctorNotes }}
                  </p>
                  <p v-if="record.treatmentPlan" class="mt-2 text-sm leading-6 text-slate-600">Phác đồ: {{ record.treatmentPlan }}</p>
                </BaseCard>
              </div>
              <EmptyState v-else text="Chưa có bệnh án được tạo cho bệnh nhân này." />
            </RecordSection>

            <RecordSection title="Đơn thuốc điều trị" :count="selectedHistory.prescriptions.length" icon-class="bg-indigo-50 text-indigo-700">
              <template #icon><Pill class="h-5 w-5" /></template>
              <div v-if="selectedHistory.prescriptions.length" class="grid gap-3 md:grid-cols-2">
                <BaseCard v-for="prescription in selectedHistory.prescriptions" :key="String(prescription.prescriptionId || prescription.id)" class="p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-bold text-slate-950">Đơn thuốc #{{ prescription.prescriptionId || prescription.id || '-' }}</p>
                      <p class="mt-1 text-sm text-slate-500">{{ formatDateTime(prescription.createdAt || prescription.submittedAt) }}</p>
                    </div>
                    <StatusBadge :status="prescription.status" />
                  </div>
                  <p class="mt-3 text-sm text-slate-600">Số thuốc: {{ prescription.items?.length || prescription.prescriptionItems?.length || 0 }}</p>
                  <p v-if="prescription.note" class="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{{ prescription.note }}</p>
                </BaseCard>
              </div>
              <EmptyState v-else text="Chưa có đơn thuốc trong lịch sử bệnh nhân." />
            </RecordSection>
          </template>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { ClipboardList, FileHeart, Pill, RefreshCw, Search, UserRound, UsersRound } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { medicalRecordApi, type PatientMedicalHistory } from '@/services/medicalRecordApi'
import type { Patient } from '@/types/medicalRecord'
import { displayText } from '@/utils/displayText'

const patients = ref<Patient[]>([])
const selectedPatientId = ref<string | number>('')
const selectedHistory = ref<PatientMedicalHistory>({ visits: [], medicalRecords: [], prescriptions: [] })
const patientQuery = ref('')
const loading = ref(false)
const historyLoading = ref(false)
const healthOk = ref(false)
const error = ref('')

const filteredPatients = computed(() => {
  const keyword = patientQuery.value.trim().toLowerCase()
  if (!keyword) return patients.value
  return patients.value.filter((patient) => {
    const text = `${patient.fullName || ''} ${patient.phone || patient.phoneNumber || ''} ${patientKey(patient)}`.toLowerCase()
    return text.includes(keyword)
  })
})

const selectedPatient = computed(() => patients.value.find((patient) => patientKey(patient) === String(selectedPatientId.value)))

onMounted(loadData)

async function loadData() {
  loading.value = true
  error.value = ''
  selectedHistory.value = { visits: [], medicalRecords: [], prescriptions: [] }

  try {
    await medicalRecordApi.getHealth()
    healthOk.value = true
  } catch (apiError) {
    healthOk.value = false
    error.value = getApiErrorMessage(apiError)
  }

  try {
    patients.value = await medicalRecordApi.getPatients()
    selectedPatientId.value = patientKey(patients.value[0])
    if (selectedPatientId.value) await loadHistory(selectedPatientId.value)
  } catch (apiError) {
    error.value = getApiErrorMessage(apiError)
  } finally {
    loading.value = false
  }
}

async function selectPatient(patient: Patient) {
  const id = patientKey(patient)
  selectedPatientId.value = id
  await loadHistory(id)
}

async function loadHistory(patientId: string | number) {
  if (!patientId) return
  historyLoading.value = true
  error.value = ''
  try {
    selectedHistory.value = await medicalRecordApi.getPatientHistory(patientId)
  } catch (apiError: any) {
    if (apiError?.response?.status === 404) {
      selectedHistory.value = { visits: [], medicalRecords: [], prescriptions: [] }
      return
    }
    error.value = getApiErrorMessage(apiError)
  } finally {
    historyLoading.value = false
  }
}

function patientKey(patient?: Partial<Patient> & Record<string, any>) {
  return String(patient?.patientId ?? patient?.id ?? '')
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN').format(date)
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function genderLabel(value?: string) {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'male' || normalized === 'nam') return 'Nam'
  if (normalized === 'female' || normalized === 'nữ' || normalized === 'nu') return 'Nữ'
  return value || 'Chưa cập nhật'
}

function statusText(status?: string) {
  const value = String(status || '').toLowerCase()
  if (value.includes('confirmed')) return 'Đã xác nhận'
  if (value.includes('checked')) return 'Đã tiếp nhận'
  if (value.includes('progress')) return 'Đang xử lý'
  if (value.includes('completed') || value.includes('done')) return 'Hoàn tất'
  if (value.includes('cancel')) return 'Đã hủy'
  if (value.includes('pending') || value.includes('waiting')) return 'Đang chờ'
  return status || 'Chưa cập nhật'
}

function statusClass(status?: string) {
  const value = String(status || '').toLowerCase()
  if (value.includes('completed') || value.includes('done') || value.includes('confirmed') || value.includes('checked')) return 'bg-emerald-100 text-emerald-700'
  if (value.includes('progress')) return 'bg-blue-100 text-blue-700'
  if (value.includes('pending') || value.includes('waiting')) return 'bg-amber-100 text-amber-700'
  if (value.includes('cancel')) return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

const InfoItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', [
      h('dt', { class: 'text-slate-500' }, props.label),
      h('dd', { class: 'mt-1 font-semibold text-slate-900' }, props.value),
    ])
  },
})

const StatusBadge = defineComponent({
  props: {
    status: { type: String, default: '' },
  },
  setup(props) {
    return () => h('span', { class: ['inline-flex rounded-full px-2.5 py-1 text-xs font-bold', statusClass(props.status)] }, statusText(props.status))
  },
})

const EmptyState = defineComponent({
  props: {
    text: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500' }, props.text)
  },
})

const RecordSection = defineComponent({
  props: {
    title: { type: String, required: true },
    count: { type: Number, required: true },
    iconClass: { type: String, required: true },
  },
  setup(props, { slots }) {
    return () => h('section', { class: 'rounded-2xl border border-slate-200 bg-white p-5 shadow-card' }, [
      h('div', { class: 'mb-4 flex items-center justify-between gap-3' }, [
        h('div', { class: 'flex items-center gap-3' }, [
          h('span', { class: ['flex h-10 w-10 items-center justify-center rounded-xl', props.iconClass] }, slots.icon?.()),
          h('h2', { class: 'text-lg font-bold text-slate-950' }, props.title),
        ]),
        h('span', { class: 'rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700' }, `${props.count} dòng`),
      ]),
      slots.default?.(),
    ])
  },
})
</script>
