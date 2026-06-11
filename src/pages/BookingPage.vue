<template>
  <section class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
        <div>
          <h1 class="mt-4 text-3xl font-bold leading-tight tracking-normal text-slate-950">
            Chọn chuyên khoa, bác sĩ và khung giờ phù hợp
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {{ bookingIntroText }}
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <div v-for="item in summary" :key="item.label" class="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-400">{{ item.label }}</p>
            <p class="mt-2 text-2xl font-bold text-slate-950">{{ item.value }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ item.note }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BaseSelect v-model="selectedSpecialty" label="Chuyên khoa" :options="specialtyOptions" placeholder="Chọn chuyên khoa" />
          <div class="space-y-2">
            <BaseSelect v-model="selectedDoctor" label="Bác sĩ" :options="doctorOptions" placeholder="Xem bác sĩ" required />
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-[#0F52BA] transition duration-200 hover:border-blue-200 hover:bg-blue-100 hover:text-[#003c90] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loadingCatalog"
              @click="catalogModalOpen = true"
            >
              <Eye class="h-4 w-4" />
              Xem bác sĩ
            </button>
          </div>
          <BaseInput v-model="selectedDate" label="Ngày khám" type="date" :min="today" />
          <div class="flex items-end">
            <BaseButton class="w-full" size="lg" :loading="loadingSlots" :disabled="!selectedDoctor || !selectedDate" @click="findSlots">
              <template #icon><Search class="h-4 w-4" /></template>
              Kiểm tra lịch trống
            </BaseButton>
          </div>
        </div>

        <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <SlotPicker
            v-model="selectedSlot"
            :slots="slots"
            :all-slots="displaySlots"
            :booked-slots="bookedSlots"
            :loading="loadingSlots"
          />
        </div>

        <div v-if="apiMessage" class="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#003c90]">
          {{ apiMessage }}
        </div>

        <div v-if="isPatientBookingRoute" class="mt-5 border-t border-slate-100 pt-5">
          <AppointmentForm
            layout="inline"
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

      <aside class="space-y-6">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Tóm tắt lịch khám</p>
              <h2 class="mt-2 text-lg font-bold text-slate-950">{{ displayText(doctor?.doctorName) || 'Chưa chọn bác sĩ' }}</h2>
              <button
                v-if="doctor"
                type="button"
                class="mt-2 text-sm font-semibold text-[#0F52BA] transition hover:text-[#003c90]"
                @click="doctorDetailOpen = true"
              >
                Xem hồ sơ bác sĩ
              </button>
            </div>
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0F52BA]">
              <Stethoscope class="h-5 w-5" />
            </span>
          </div>
          <dl class="mt-5 space-y-4 text-sm">
            <div class="rounded-xl bg-slate-50 p-3">
              <dt class="text-slate-500">Chuyên khoa</dt>
              <dd class="mt-1 font-bold text-slate-950">{{ displayText(doctor?.specialtyName) || 'Chưa chọn' }}</dd>
            </div>
            <div class="rounded-xl bg-slate-50 p-3">
              <dt class="text-slate-500">Ngày giờ</dt>
              <dd class="mt-1 font-bold text-slate-950">{{ selectedDate || 'Chưa chọn' }} - {{ selectedSlot || 'Chưa chọn' }}</dd>
            </div>
            <div class="rounded-xl bg-slate-50 p-3">
              <dt class="text-slate-500">Phí khám</dt>
              <dd class="mt-1 font-bold text-[#003c90]">{{ formatCurrency(doctor?.examFee || 0) }}</dd>
            </div>
          </dl>
        </div>

        <div v-if="!isPatientBookingRoute" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
      </aside>
    </div>

    <Toast
      :show="toast.show"
      :title="toast.title"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="catalogModalOpen"
          class="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
          @click.self="catalogModalOpen = false"
        >
          <div class="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-soft">
            <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Doctor Catalog</p>
                <h2 class="mt-1 text-xl font-bold tracking-normal text-slate-950">
                  Danh sách bác sĩ - {{ catalogSpecialtyName }}
                </h2>
              </div>
              <button
                type="button"
                class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100"
                aria-label="Đóng danh sách bác sĩ"
                @click="catalogModalOpen = false"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="max-h-[72vh] overflow-y-auto p-5 sm:p-6">
              <div v-if="filteredDoctors.length" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <article
                  v-for="item in filteredDoctors"
                  :key="item.doctorId"
                  class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-blue-200 hover:shadow-card"
                >
                  <div class="flex gap-4">
                    <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-[#0F52BA] ring-1 ring-blue-100">
                      <img v-if="item.avatarUrl" :src="item.avatarUrl" :alt="doctorName(item)" class="h-full w-full object-cover" />
                      <UserRound v-else class="h-8 w-8" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3 class="truncate text-base font-bold text-slate-950">{{ doctorName(item) }}</h3>
                      <p class="mt-1 text-sm font-semibold text-[#0F52BA]">{{ item.degree || 'Bác sĩ chuyên khoa' }}</p>
                      <div class="mt-3 grid gap-2 text-sm text-slate-600">
                        <p class="flex items-center gap-2">
                          <Stethoscope class="h-4 w-4 text-slate-400" />
                          <span class="truncate">{{ displayText(item.specialtyName) }}</span>
                        </p>
                        <p class="flex items-center gap-2">
                          <BadgeCheck class="h-4 w-4 text-slate-400" />
                          <span>{{ item.experienceYears ? `${item.experienceYears} năm kinh nghiệm` : 'Kinh nghiệm đang cập nhật' }}</span>
                        </p>
                      </div>
                      <p class="mt-3 text-sm font-bold text-[#003c90]">{{ formatCurrency(item.examFee || 0) }}</p>
                    </div>
                  </div>

                  <div class="mt-4 grid gap-2 sm:grid-cols-2">
                    <BaseButton variant="outline" size="sm" @click="openDoctorDetail(item)">
                      <template #icon><Eye class="h-4 w-4" /></template>
                      Hồ sơ chi tiết
                    </BaseButton>
                    <BaseButton size="sm" @click="selectDoctorFromCatalog(item)">
                      Chọn bác sĩ này
                    </BaseButton>
                  </div>
                </article>
              </div>

              <div v-else class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <UserRound class="mx-auto h-10 w-10 text-slate-300" />
                <p class="mt-3 font-semibold text-slate-900">Chưa có bác sĩ phù hợp</p>
                <p class="mt-1 text-sm text-slate-500">Vui lòng chọn chuyên khoa khác hoặc quay lại sau.</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <DoctorDetailModal :doctor="activeDetailDoctor" @close="closeDoctorDetail" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BadgeCheck, Eye, Search, Stethoscope, UserRound, X } from 'lucide-vue-next'
import AppointmentForm from '@/components/booking/AppointmentForm.vue'
import DoctorDetailModal from '@/components/booking/DoctorDetailModal.vue'
import SlotPicker from '@/components/booking/SlotPicker.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import Toast from '@/components/ui/Toast.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/services/apiClient'
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
const bookedSlots = ref<string[]>([])
const loadingSlots = ref(false)
const loadingCatalog = ref(false)
const submitting = ref(false)
const apiMessage = ref('')
const catalogModalOpen = ref(false)
const doctorDetailOpen = ref(false)
const catalogDetailDoctor = ref<Doctor | null>(null)
const today = new Date().toISOString().slice(0, 10)
const toast = reactive({
  show: false,
  title: '',
  message: '',
  type: 'success' as 'success' | 'error',
})

const isPatientBookingRoute = computed(() => route.path.startsWith('/patient'))
const bookingIntroText = computed(() => isPatientBookingRoute.value
  ? 'Danh sách bác sĩ, chuyên khoa và khung giờ trống luôn được cập nhật để bạn dễ chọn lịch khám phù hợp.'
  : 'Dữ liệu bác sĩ, chuyên khoa và lịch trống được đọc từ N1 Appointment Service qua API Gateway.',
)

const summary = computed(() => [
  { label: 'Chuyên khoa', value: specialties.value.length, note: 'Đang hoạt động' },
  { label: 'Bác sĩ', value: doctors.value.length, note: 'Có thể đặt lịch' },
  { label: 'Slot trống', value: slots.value.length, note: selectedDoctor.value ? 'Theo ngày đã chọn' : 'Chọn bác sĩ trước' },
])

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
const catalogSpecialtyName = computed(() => {
  if (!selectedSpecialty.value) return 'Tất cả chuyên khoa'
  return displayText(specialties.value.find((item) => item.specialtyId === Number(selectedSpecialty.value))?.specialtyName)
    || 'Tất cả chuyên khoa'
})
const activeDetailDoctor = computed(() => catalogDetailDoctor.value || (doctorDetailOpen.value ? doctor.value || null : null))
const displaySlots = computed(() => mergeSlots(slots.value, bookedSlots.value))
const bookingPatientId = computed(() => authStore.isPatient ? authStore.user?.patientId : undefined)
const bookingPatientName = computed(() => authStore.isPatient ? authStore.user?.fullName : '')
const bookingPatientPhone = computed(() => authStore.isPatient ? authStore.user?.phoneNumber : '')

watch(selectedSpecialty, () => {
  if (selectedDoctor.value && !filteredDoctors.value.some((item) => item.doctorId === Number(selectedDoctor.value))) {
    selectedDoctor.value = ''
  }
  selectedSlot.value = ''
  slots.value = []
  bookedSlots.value = []
})

watch([selectedDoctor, selectedDate], () => {
  selectedSlot.value = ''
  slots.value = []
  bookedSlots.value = []
  apiMessage.value = ''
})

onMounted(loadCatalog)

async function loadCatalog() {
  loadingCatalog.value = true
  apiMessage.value = ''
  try {
    const [doctorData, specialtyData] = await Promise.all([
      appointmentApi.getDoctors(),
      appointmentApi.getSpecialties(),
    ])
    doctors.value = doctorData
    specialties.value = specialtyData
    if (!doctorData.length || !specialtyData.length) {
      apiMessage.value = 'Database chưa có đủ bác sĩ hoặc chuyên khoa để đặt lịch.'
    }
  } catch (error) {
    doctors.value = []
    specialties.value = []
    apiMessage.value = getApiErrorMessage(error)
  } finally {
    loadingCatalog.value = false
  }

  const queryDoctorId = Number(route.query.doctorId)
  if (queryDoctorId) {
    const queryDoctor = doctors.value.find((item) => item.doctorId === queryDoctorId)
    if (queryDoctor) {
      selectedDoctor.value = String(queryDoctor.doctorId)
      selectedSpecialty.value = String(queryDoctor.specialtyId)
    }
  }
}

async function findSlots() {
  if (!selectedDoctor.value || !selectedDate.value) return
  loadingSlots.value = true
  selectedSlot.value = ''
  apiMessage.value = ''
  try {
    const [data, booked] = await Promise.all([
      appointmentApi.getAvailableSlots(Number(selectedDoctor.value), selectedDate.value),
      appointmentApi.getBookedSlots(Number(selectedDoctor.value), selectedDate.value).catch(() => []),
    ])
    slots.value = data
    bookedSlots.value = booked
    if (!data.length) apiMessage.value = 'Không có giờ trống trong database cho bác sĩ và ngày đã chọn.'
  } catch (error) {
    slots.value = []
    bookedSlots.value = []
    apiMessage.value = getApiErrorMessage(error)
  } finally {
    loadingSlots.value = false
  }
}

async function submitBooking(payload: CreateAppointmentRequest) {
  submitting.value = true
  try {
    const latestSlots = await appointmentApi.getAvailableSlots(payload.doctorId, payload.appointmentDate)
    if (!latestSlots.map((slot) => slot.slice(0, 5)).includes(payload.slotTime.slice(0, 5))) {
      selectedSlot.value = ''
      await findSlots()
      throw new Error('Khung giờ này vừa được người khác đặt. Vui lòng chọn giờ khác.')
    }
    const appointment = await appointmentApi.createAppointment(payload)
    toast.title = 'Đặt lịch thành công'
    toast.message = `Mã lịch hẹn: ${appointment.appointmentId || 'đang cập nhật'}`
    toast.type = 'success'
    toast.show = true
    await findSlots()
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

function doctorName(item?: Doctor | null) {
  return displayText(item?.doctorName || item?.fullName || '')
}

function openDoctorDetail(item: Doctor) {
  catalogDetailDoctor.value = item
}

function closeDoctorDetail() {
  doctorDetailOpen.value = false
  catalogDetailDoctor.value = null
}

function selectDoctorFromCatalog(item: Doctor) {
  selectedDoctor.value = String(item.doctorId)
  catalogModalOpen.value = false
  closeDoctorDetail()
}

function mergeSlots(...groups: string[][]) {
  return Array.from(new Set(groups.flat().map((slot) => String(slot || '').slice(0, 5)).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}
</script>
