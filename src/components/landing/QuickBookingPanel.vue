<template>
  <section id="booking" class="relative z-20 -mt-20">
    <div class="container-page">
      <div v-reveal class="rounded-lg border border-slate-200 bg-white/85 p-5 shadow-xl backdrop-blur">
        <div class="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <BaseSelect
            v-model="selectedSpecialty"
            label="Chuyên khoa"
            :options="specialtyOptions"
            placeholder="Chọn chuyên khoa"
          />
          <BaseSelect
            v-model="selectedDoctor"
            label="Bác sĩ"
            :options="doctorOptions"
            placeholder="Chọn bác sĩ"
          />
          <BaseInput v-model="selectedDate" label="Ngày khám" type="date" :min="today" />
          <BaseButton
            class="h-12 w-full rounded-lg bg-[#003c90] px-7 text-sm font-semibold hover:bg-[#0f52ba] lg:w-auto"
            :loading="loadingSlots"
            :disabled="!selectedDoctor || !selectedDate"
            @click="findSlots"
          >
            <template #icon><Search class="h-4 w-4" /></template>
            Kiểm tra lịch trống
          </BaseButton>
        </div>

        <div v-if="store.usingFallback" class="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Chưa tải được dữ liệu từ API, đang hiển thị dữ liệu mẫu tạm thời.
        </div>

        <div v-if="slots.length || loadingSlots || searchedSlots" class="mt-6 border-t border-slate-100 pt-5">
          <SlotPicker v-model="selectedSlot" :slots="slots" :loading="loadingSlots" />
        </div>
      </div>
    </div>

    <BookingModal
      :open="modalOpen"
      :doctor="doctor"
      :appointmentDate="selectedDate"
      :slotTime="selectedSlot"
      @close="modalOpen = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import BookingModal from '@/components/booking/BookingModal.vue'
import SlotPicker from '@/components/booking/SlotPicker.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { useAppointmentStore } from '@/stores/appointmentStore'
import { useAuthStore } from '@/stores/authStore'
import { displayText } from '@/utils/displayText'

const router = useRouter()
const store = useAppointmentStore()
const authStore = useAuthStore()
const selectedSpecialty = ref('')
const selectedDoctor = ref('')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedSlot = ref('')
const slots = ref<string[]>([])
const loadingSlots = ref(false)
const searchedSlots = ref(false)
const modalOpen = ref(false)
const today = new Date().toISOString().slice(0, 10)

onMounted(() => store.loadCatalog())

const specialtyOptions = computed(() =>
  store.specialties.map((specialty) => ({
    label: displayText(specialty.specialtyName),
    value: specialty.specialtyId,
  })),
)

const filteredDoctors = computed(() =>
  selectedSpecialty.value
    ? store.doctors.filter((doctor) => doctor.specialtyId === Number(selectedSpecialty.value))
    : store.doctors,
)

const doctorOptions = computed(() =>
  filteredDoctors.value.map((doctor) => ({
    label: `${displayText(doctor.doctorName)} - ${displayText(doctor.specialtyName)}`,
    value: doctor.doctorId,
  })),
)

const doctor = computed(() => store.doctors.find((item) => item.doctorId === Number(selectedDoctor.value)))

watch(selectedSpecialty, () => {
  if (selectedDoctor.value && !filteredDoctors.value.some((item) => item.doctorId === Number(selectedDoctor.value))) {
    selectedDoctor.value = ''
  }
  slots.value = []
  selectedSlot.value = ''
  searchedSlots.value = false
})

watch(selectedSlot, (slot) => {
  if (!slot) return
  if (!authStore.isAuthenticated) {
    const query = new URLSearchParams()
    if (selectedDoctor.value) query.set('doctorId', selectedDoctor.value)
    const redirect = `/booking${query.toString() ? `?${query.toString()}` : ''}`
    router.push({ path: '/login', query: { redirect } })
    return
  }
  modalOpen.value = true
})

async function findSlots() {
  if (!selectedDoctor.value || !selectedDate.value) return
  loadingSlots.value = true
  selectedSlot.value = ''
  slots.value = await store.loadSlots(Number(selectedDoctor.value), selectedDate.value)
  searchedSlots.value = true
  loadingSlots.value = false
}
</script>
