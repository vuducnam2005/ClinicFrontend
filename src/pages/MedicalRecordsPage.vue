<template>
 <section class="bg-white py-12">
 <div class="container-page">
 <div class="rounded-2xl bg-emerald-950 p-6 text-white shadow-soft sm:p-8">
 <p class="text-sm font-semibold text-emerald-200">N2 - Medical Record Service</p>
 <h1 class="mt-3 text-3xl font-semibold sm:text-4xl">Hồ sơ bệnh án</h1>
 <p class="mt-4 max-w-3xl text-emerald-50">
 Khu vực này đọc dữ liệu bệnh nhân và bệnh án từ Medical Record Service. Đây là phần N2 trong phân công service.
 </p>
 </div>

 <div class="mt-6 grid gap-4 md:grid-cols-3">
 <BaseCard class="p-5">
 <p class="text-sm text-slate-500">Trạng thái N2</p>
 <div class="mt-3 flex items-center gap-2">
 <span class="h-2.5 w-2.5 rounded-full" :class="healthOk ? 'bg-teal-500' : 'bg-rose-500'"></span>
 <p class="font-semibold text-slate-950">{{ healthOk ? 'Đang chạy' : 'Cần kiểm tra' }}</p>
 </div>
 </BaseCard>
 <BaseCard class="p-5">
 <p class="text-sm text-slate-500">Bệnh nhân</p>
 <p class="mt-2 text-3xl font-bold text-slate-950">{{ patients.length }}</p>
 </BaseCard>
 <BaseCard class="p-5">
 <p class="text-sm text-slate-500">Bệnh án</p>
 <p class="mt-2 text-3xl font-bold text-slate-950">{{ records.length }}</p>
 </BaseCard>
 </div>

 <div v-if="error" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
 {{ error }}
 </div>

 <div class="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
 <section>
 <div class="mb-4 flex items-center justify-between">
 <h2 class="text-xl font-semibold text-slate-950">Danh sách bệnh nhân</h2>
 <BaseButton variant="outline" size="sm" :disabled="loading" @click="loadData">Tải lại</BaseButton>
 </div>

 <div v-if="loading" class="space-y-4">
 <LoadingSkeleton v-for="item in 3" :key="item" />
 </div>

 <div v-else-if="patients.length" class="space-y-3">
 <button
 v-for="patient in patients"
 :key="patient.patientId"
 class="w-full rounded-xl border p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
 :class="selectedPatientId === patient.patientId ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'"
 type="button"
 @click="selectedPatientId = patient.patientId"
 >
 <div class="flex items-start gap-3">
 <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
 <UserRound class="h-5 w-5" />
 </div>
 <div class="min-w-0 flex-1">
 <p class="font-semibold text-slate-950">{{ displayText(patient.fullName) }}</p>
 <p class="mt-1 text-sm text-slate-500">{{ patient.phone || patient.phoneNumber || 'Chưa có số điện thoại' }}</p>
 <p class="mt-1 text-xs text-slate-400">{{ patient.patientId }}</p>
 </div>
 </div>
 </button>
 </div>

 <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
 <UsersRound class="mx-auto h-10 w-10 text-slate-400" />
 <h3 class="mt-4 font-semibold text-slate-950">Chưa có bệnh nhân</h3>
 <p class="mt-2 text-sm text-slate-500">Nếu API trả mảng rỗng, khu vực này sẽ hiển thị trạng thái trống.</p>
 </div>
 </section>

 <section>
 <h2 class="mb-4 text-xl font-semibold text-slate-950">Bệnh án theo bệnh nhân</h2>
 <BaseCard class="p-5">
 <template v-if="selectedPatient">
 <p class="text-sm text-slate-500">Bệnh nhân đang chọn</p>
 <h3 class="mt-2 text-2xl font-semibold text-slate-950">{{ displayText(selectedPatient.fullName) }}</h3>
 <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
 <div>
 <dt class="text-slate-500">Giới tính</dt>
 <dd class="font-medium text-slate-900">{{ genderLabel(selectedPatient.gender) }}</dd>
 </div>
 <div>
 <dt class="text-slate-500">Ngày sinh</dt>
 <dd class="font-medium text-slate-900">{{ formatDate(selectedPatient.dateOfBirth) }}</dd>
 </div>
 <div class="sm:col-span-2">
 <dt class="text-slate-500">Tiền sử bệnh</dt>
 <dd class="font-medium text-slate-900">{{ selectedPatient.medicalHistory || 'Chưa ghi nhận' }}</dd>
 </div>
 </dl>
 </template>
 <p v-else class="text-sm text-slate-500">Chọn một bệnh nhân để xem thông tin chi tiết.</p>
 </BaseCard>

 <div class="mt-4 space-y-3">
 <BaseCard v-for="record in selectedRecords" :key="record.recordId || record.medicalRecordId" class="p-5">
 <div class="flex items-start gap-3">
 <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
 <FileHeart class="h-5 w-5" />
 </div>
 <div>
 <p class="font-semibold text-slate-950">{{ record.diagnosis || 'Chưa có chẩn đoán' }}</p>
 <p class="mt-1 text-sm text-slate-500">{{ formatDate(record.examDate || record.createdAt) }}</p>
 <p v-if="record.symptoms" class="mt-3 text-sm text-slate-600">Triệu chứng: {{ record.symptoms }}</p>
 <p v-if="record.doctorNotes" class="mt-1 text-sm text-slate-600">Ghi chú: {{ record.doctorNotes }}</p>
 </div>
 </div>
 </BaseCard>

 <div v-if="selectedPatient && !selectedRecords.length" class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
 Bệnh nhân này chưa có bệnh án hoặc endpoint bệnh án chưa có dữ liệu.
 </div>
 </div>
 </section>
 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { FileHeart, UserRound, UsersRound } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { getApiErrorMessage } from '@/services/apiClient'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import type { MedicalRecord, Patient } from '@/types/medicalRecord'
import { displayText } from '@/utils/displayText'

const patients = ref<Patient[]>([])
const records = ref<MedicalRecord[]>([])
const selectedPatientId = ref('')
const loading = ref(false)
const healthOk = ref(false)
const error = ref('')

const selectedPatient = computed(() => patients.value.find((patient) => patient.patientId === selectedPatientId.value))
const selectedRecords = computed(() =>
 records.value.filter((record) => !selectedPatientId.value || record.patientId === selectedPatientId.value),
)

onMounted(loadData)

async function loadData() {
 loading.value = true
 error.value = ''
 try {
 await medicalRecordApi.getHealth()
 healthOk.value = true
 } catch (apiError) {
 healthOk.value = false
 error.value = getApiErrorMessage(apiError)
 }

 try {
 const [patientData, recordData] = await Promise.all([
 medicalRecordApi.getPatients(),
 medicalRecordApi.getMedicalRecords(),
 ])
 patients.value = patientData
 records.value = recordData
 selectedPatientId.value = patientData[0]?.patientId || ''
 } catch (apiError) {
 error.value = getApiErrorMessage(apiError)
 } finally {
 loading.value = false
 }
}

function formatDate(value?: string) {
 if (!value) return 'Chưa cập nhật'
 return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

function genderLabel(value?: string) {
 const map: Record<string, string> = {
 Male: 'Nam',
 Female: 'Nữ',
 }
 return value ? map[value] || value : 'Chưa cập nhật'
}
</script>
