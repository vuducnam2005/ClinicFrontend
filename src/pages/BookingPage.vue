<template>
 <section class="bg-slate-50 py-12">
 <div class="container-page">
 <div class="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
 <aside class="rounded-2xl bg-slate-950 p-6 text-white shadow-soft sm:p-8">
 <p class="text-sm font-semibold text-cyan-200">Đặt lịch khám</p>
 <h1 class="mt-3 text-3xl font-semibold sm:text-4xl">Chọn bác sĩ, giờ khám và xác nhận thông tin</h1>
 <p class="mt-4 text-slate-300">
 Form này gọi POST /api/appointments. Nếu endpoint slot chưa có, frontend tự hiển thị slot dự phòng.
 </p>
 <div class="mt-8 space-y-4">
 <div v-for="item in highlights" :key="item" class="flex items-center gap-3 text-sm text-slate-200">
 <CheckCircle2 class="h-5 w-5 text-teal-300" />
 {{ item }}
 </div>
 </div>
 </aside>

 <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
 <div class="grid gap-4 sm:grid-cols-2">
 <BaseSelect v-model="selectedSpecialty" label="Chuyên khoa" :options="specialtyOptions" placeholder="Chọn chuyên khoa" />
 <BaseSelect v-model="selectedDoctor" label="Bác sĩ" :options="doctorOptions" placeholder="Chọn bác sĩ" required />
 <BaseInput v-model="selectedDate" label="Ngày khám" type="date" :min="today" />
 <div class="flex items-end">
 <BaseButton class="w-full" size="lg" :loading="loadingSlots" :disabled="!selectedDoctor || !selectedDate" @click="findSlots">
 <template #icon><Search class="h-4 w-4" /></template>
 Tìm giờ trống
 </BaseButton>
 </div>
 </div>

 <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
 <SlotPicker v-model="selectedSlot" :slots="slots" :loading="loadingSlots" />
 </div>

 <div class="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
 <div class="rounded-xl border border-slate-200 p-4">
 <p class="text-sm font-semibold text-slate-950">Thông tin lịch khám</p>
 <dl class="mt-4 space-y-3 text-sm">
 <div>
 <dt class="text-slate-500">Bác sĩ</dt>
 <dd class="mt-1 font-semibold text-slate-900">{{ displayText(doctor?.doctorName) || 'Chưa chọn' }}</dd>
 </div>
 <div>
 <dt class="text-slate-500">Chuyên khoa</dt>
 <dd class="mt-1 font-semibold text-slate-900">{{ displayText(doctor?.specialtyName) || 'Chưa chọn' }}</dd>
 </div>
 <div>
 <dt class="text-slate-500">Ngày giờ</dt>
 <dd class="mt-1 font-semibold text-slate-900">{{ selectedDate || 'Chưa chọn' }} - {{ selectedSlot || 'Chưa chọn' }}</dd>
 </div>
 <div>
 <dt class="text-slate-500">Phí khám</dt>
 <dd class="mt-1 font-semibold text-slate-900">{{ formatCurrency(doctor?.examFee || 0) }}</dd>
 </div>
 </dl>
 </div>

 <AppointmentForm
:doctorId="doctor?.doctorId || 0"
:appointmentDate="selectedDate"
:slotTime="selectedSlot"
:loading="submitting"
:initialPatientId="bookingPatientId"
:initialPatientName="bookingPatientName"
:initialPatientPhone="bookingPatientPhone"
 @submit="submitBooking"
 />
 </div>
 </div>
 </div>
 </div>

 <Toast
:show="toast.show"
:title="toast.title"
:message="toast.message"
:type="toast.type"
 @close="toast.show = false"
 />
 </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CheckCircle2, Search } from 'lucide-vue-next'
import AppointmentForm from '@/components/booking/AppointmentForm.vue'
import SlotPicker from '@/components/booking/SlotPicker.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import Toast from '@/components/ui/Toast.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
import { fallbackDoctors, fallbackSlots, fallbackSpecialties } from '@/services/fallbackData'
import type { CreateAppointmentRequest } from '@/types/appointment'
import type { Doctor } from '@/types/doctor'
import type { Specialty } from '@/types/specialty'
import { displayText } from '@/utils/displayText'

const route = useRoute()
const authStore = useAuthStore()
const doctors = ref<Doctor[]>([])
const specialties = ref<Specialty[]>([])
const selectedSpecialty = ref('')
const selectedDoctor = ref('')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedSlot = ref('')
const slots = ref<string[]>([])
const loadingSlots = ref(false)
const submitting = ref(false)
const today = new Date().toISOString().slice(0, 10)
const toast = reactive({
 show: false,
 title: '',
 message: '',
 type: 'success' as 'success' | 'error',
})

const highlights = [
 'Tự động lọc bác sĩ theo chuyên khoa',
 'Lấy slot trống theo ngày khám',
 'Dữ liệu dự phòng nếu API chưa hoàn thiện',
]

const specialtyOptions = computed(() =>
 specialties.value.map((specialty) => ({ label: displayText(specialty.specialtyName), value: specialty.specialtyId })),
)

const filteredDoctors = computed(() =>
 selectedSpecialty.value
 ? doctors.value.filter((doctor) => doctor.specialtyId === Number(selectedSpecialty.value))
 : doctors.value,
)

const doctorOptions = computed(() =>
 filteredDoctors.value.map((doctor) => ({
 label: `${displayText(doctor.doctorName)} - ${displayText(doctor.specialtyName)}`,
 value: doctor.doctorId,
 })),
)

const doctor = computed(() => doctors.value.find((item) => item.doctorId === Number(selectedDoctor.value)))
const bookingPatientId = computed(() => authStore.isPatient ? authStore.user?.patientId : undefined)
const bookingPatientName = computed(() => authStore.isPatient ? authStore.user?.fullName : '')
const bookingPatientPhone = computed(() => authStore.isPatient ? authStore.user?.phoneNumber : '')

watch(selectedSpecialty, () => {
 if (selectedDoctor.value && !filteredDoctors.value.some((item) => item.doctorId === Number(selectedDoctor.value))) {
 selectedDoctor.value = ''
 }
 selectedSlot.value = ''
 slots.value = []
})

onMounted(async () => {
 try {
 const [doctorData, specialtyData] = await Promise.all([
 appointmentApi.getDoctors(),
 appointmentApi.getSpecialties(),
 ])
 doctors.value = doctorData.length ? doctorData : fallbackDoctors
 specialties.value = specialtyData.length ? specialtyData : fallbackSpecialties
 } catch {
 doctors.value = fallbackDoctors
 specialties.value = fallbackSpecialties
 }

 const queryDoctorId = Number(route.query.doctorId)
 if (queryDoctorId) {
 const queryDoctor = doctors.value.find((item) => item.doctorId === queryDoctorId)
 if (queryDoctor) {
 selectedDoctor.value = String(queryDoctor.doctorId)
 selectedSpecialty.value = String(queryDoctor.specialtyId)
 }
 }
})

async function findSlots() {
 if (!selectedDoctor.value || !selectedDate.value) return
 loadingSlots.value = true
 selectedSlot.value = ''
 try {
 const data = await appointmentApi.getAvailableSlots(Number(selectedDoctor.value), selectedDate.value)
 slots.value = data.length ? data : fallbackSlots
 if (!data.length) {
 toast.title = 'Đang dùng giờ khám dự phòng'
 toast.message = 'API slot trả rỗng, frontend hiển thị khung giờ mẫu để bạn tiếp tục test đặt lịch.'
 toast.type = 'success'
 toast.show = true
 }
 } catch {
 slots.value = fallbackSlots
 } finally {
 loadingSlots.value = false
 }
}

async function submitBooking(payload: CreateAppointmentRequest) {
 submitting.value = true
 try {
 const appointment = await appointmentApi.createAppointment(payload)
 toast.title = 'Đặt lịch thành công'
 toast.message = `Mã lịch hẹn: ${appointment.appointmentId || 'đang cập nhật'}`
 toast.type = 'success'
 toast.show = true
 } catch (error) {
 toast.title = 'Chưa thể đặt lịch'
 toast.message = getApiErrorMessage(error)
 toast.type = 'error'
 toast.show = true
 } finally {
 submitting.value = false
 }
}

function formatCurrency(value: number) {
 return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}
</script>
