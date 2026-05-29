<template>
 <section class="-mt-16 relative z-30">
 <div class="container-page">
 <!-- Premium Glass Panel with deep floating shadows and teal highlights -->
 <div v-reveal class="glass-panel rounded-3xl p-6 sm:p-8 shadow-floating border border-slate-200/60 bg-white ">
 <div class="grid gap-6 lg:grid-cols-[1fr_1fr_1.1fr_auto] lg:items-end">
 
 <!-- Specialty Selector -->
 <div class="space-y-1">
 <BaseSelect
 v-model="selectedSpecialty"
 label="Chuyên khoa điều trị"
:options="specialtyOptions"
 placeholder="Chọn chuyên khoa"
 class="w-full select-stripe"
 />
 </div>

 <!-- Doctor Selector -->
 <div class="space-y-1">
 <BaseSelect
 v-model="selectedDoctor"
 label="Bác sĩ phụ trách"
:options="doctorOptions"
 placeholder="Chọn bác sĩ khám"
 class="w-full select-stripe"
 />
 </div>

 <!-- Date Input -->
 <div class="space-y-1">
 <BaseInput
 v-model="selectedDate"
 label="Ngày đặt hẹn khám"
 type="date"
 :min="today"
 class="w-full input-stripe"
 />
 </div>

 <!-- CTA Trigger -->
 <BaseButton
 class="w-full lg:w-auto lg:mb-0.5 rounded-2xl shadow-medical hover:shadow-lg py-3.5 px-6 font-bold hover:scale-102 active:scale-98 transition-all"
 size="lg"
 :loading="loadingSlots"
 :disabled="!selectedDoctor || !selectedDate"
 @click="findSlots"
 >
 <template #icon><Search class="h-4.5 w-4.5" /></template>
 Tìm giờ trống
 </BaseButton>
 </div>

 <!-- Fallback Message indicator (Styled to match Stripe alert styles) -->
 <div v-if="store.usingFallback" class="mt-5 rounded-2xl bg-cyan-50/50 border border-cyan-200/30 px-5 py-3.5 text-sm text-cyan-800 flex items-center gap-2">
 <span class="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
 Đang hiển thị dữ liệu mẫu tối ưu vì các API backend thật chưa được nạp đầy đủ.
 </div>

 <!-- Slot Picker container with elegant fade in -->
 <div v-if="slots.length || loadingSlots || searchedSlots" class="mt-8 border-t border-slate-200/50 pt-6 animate-fade-in">
 <SlotPicker v-model="selectedSlot" :slots="slots" :loading="loadingSlots" />
 </div>
 </div>
 </div>

 <!-- Booking confirmation Modal -->
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

<style scoped>
.animate-fade-in {
 animation: fade-in 300ms ease both;
}
@keyframes fade-in {
 from { opacity: 0; transform: translateY(10px); }
 to { opacity: 1; transform: translateY(0); }
}
</style>
