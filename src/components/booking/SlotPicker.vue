<template>
  <div :class="['slot-picker', compact ? 'is-compact' : '']">
    <div v-if="loading" class="slot-skeleton">
      <span v-for="item in 8" :key="item" class="skeleton-slot"></span>
    </div>

    <div v-else-if="displaySlots.length" class="slot-wrap">
      <div class="slot-tabs" role="tablist" aria-label="Chọn buổi khám">
        <button
          type="button"
          :class="['slot-tab', activePeriod === 'morning' ? 'is-active' : '']"
          :disabled="!morningSlots.length"
          @click="activePeriod = 'morning'"
        >
          <Sun class="tab-icon morning-icon" />
          Buổi sáng
        </button>
        <button
          type="button"
          :class="['slot-tab', activePeriod === 'afternoon' ? 'is-active' : '']"
          :disabled="!afternoonSlots.length"
          @click="activePeriod = 'afternoon'"
        >
          <Moon class="tab-icon afternoon-icon" />
          Buổi chiều
        </button>
      </div>

      <div v-if="activeSlots.length" class="slot-grid">
        <button
          v-for="slot in activeSlots"
          :key="slot"
          type="button"
          :class="['slot-button', slotClass(slot)]"
          :disabled="!isAvailable(slot)"
          :title="slotTitle(slot)"
          @click="pick(slot)"
        >
          {{ slot }}
        </button>
      </div>

      <div v-else class="slot-empty-period">
        {{ activePeriod === 'morning' ? 'Đã hết buổi sáng' : 'Đã hết buổi chiều' }}
      </div>

      <div class="slot-legend">
        <span><i class="legend-dot free"></i>Còn trống</span>
        <span><i class="legend-dot selected"></i>Đang chọn</span>
        <span><i class="legend-dot unavailable"></i>Đã kín</span>
      </div>
    </div>

    <div v-else class="slot-empty">{{ emptyMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Moon, Sun } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  slots: string[]
  allSlots?: string[]
  bookedSlots?: string[]
  selectedDate?: string
  title?: string
  modelValue?: string
  loading?: boolean
  compact?: boolean
  emptyMessage?: string
}>(), {
  allSlots: () => [],
  bookedSlots: () => [],
  selectedDate: '',
  title: '',
  modelValue: '',
  loading: false,
  compact: false,
  emptyMessage: 'Không có khung giờ trống.',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const now = ref(new Date())
const activePeriod = ref<'morning' | 'afternoon'>('morning')
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 60_000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const availableSet = computed(() => new Set(props.slots.map(normalizeSlot)))
const bookedSet = computed(() => new Set(props.bookedSlots.map(normalizeSlot)))
const displaySlots = computed(() => {
  const source = props.allSlots.length ? props.allSlots : props.slots
  return [...new Set(source.map(normalizeSlot).filter(Boolean))].sort()
})
const selectedSlot = computed(() => normalizeSlot(props.modelValue))
const morningSlots = computed(() => displaySlots.value.filter((slot) => slot < '12:00'))
const afternoonSlots = computed(() => displaySlots.value.filter((slot) => slot >= '12:00'))
const activeSlots = computed(() => (activePeriod.value === 'morning' ? morningSlots.value : afternoonSlots.value))

const isToday = computed(() => {
  if (!props.selectedDate) return false
  const vietnamNow = new Date(now.value.getTime() + 7 * 60 * 60 * 1000)
  const today = vietnamNow.toISOString().slice(0, 10)
  return props.selectedDate === today
})

const currentTimeHHMM = computed(() => {
  const vietnamNow = new Date(now.value.getTime() + 7 * 60 * 60 * 1000)
  const hour = String(vietnamNow.getUTCHours()).padStart(2, '0')
  const minute = String(vietnamNow.getUTCMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
})

watch([morningSlots, afternoonSlots], ([morning, afternoon]) => {
  if (activePeriod.value === 'morning' && !morning.length && afternoon.length) activePeriod.value = 'afternoon'
  if (activePeriod.value === 'afternoon' && !afternoon.length && morning.length) activePeriod.value = 'morning'
}, { immediate: true })

function normalizeSlot(slot: string) {
  return String(slot || '').slice(0, 5)
}

function isExpired(slot: string) {
  if (!isToday.value) return false
  return normalizeSlot(slot) <= currentTimeHHMM.value
}

function isAvailable(slot: string) {
  const value = normalizeSlot(slot)
  return availableSet.value.has(value) && !bookedSet.value.has(value) && !isExpired(slot)
}

function isBooked(slot: string) {
  return bookedSet.value.has(normalizeSlot(slot))
}

function slotClass(slot: string) {
  const value = normalizeSlot(slot)
  if (isExpired(slot)) return 'is-expired'
  if (isBooked(slot)) return 'is-booked'
  if (!isAvailable(slot)) return 'is-off'
  if (selectedSlot.value === value) return 'is-selected'
  return 'is-free'
}

function slotTitle(slot: string) {
  if (isExpired(slot)) return 'Đã hết giờ'
  if (isBooked(slot)) return 'Đã được đặt'
  if (!isAvailable(slot)) return 'Không khả dụng'
  return `Đặt lịch lúc ${normalizeSlot(slot)}`
}

function pick(slot: string) {
  if (isAvailable(slot)) emit('update:modelValue', normalizeSlot(slot))
}
</script>

<style scoped>
.slot-picker {
  width: 100%;
}

.slot-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.slot-tabs {
  display: inline-flex;
  width: fit-content;
  gap: 8px;
  border-radius: 8px;
}

.slot-tab {
  display: inline-flex;
  height: 38px;
  min-width: 118px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #dbe4f1;
  border-radius: 7px;
  background: #fff;
  color: #50617a;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.slot-tab:hover:not(:disabled),
.slot-tab.is-active {
  border-color: #0f52ba;
  background: #eef5ff;
  color: #0f52ba;
  box-shadow: 0 0 0 2px rgba(15, 82, 186, 0.07);
}

.slot-tab:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.tab-icon {
  width: 15px;
  height: 15px;
}

.morning-icon {
  color: #f59e0b;
}

.afternoon-icon {
  color: #6474d8;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 12px;
}

.slot-button {
  display: inline-flex;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  border: 1px solid transparent;
  padding: 0 10px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, color 140ms ease, transform 140ms ease;
}

.slot-button.is-free {
  border-color: #d7e1ee;
  background: #fff;
  color: #263b5d;
}

.slot-button.is-free:hover {
  border-color: #0f52ba;
  background: #f0f6ff;
  color: #0f52ba;
  transform: translateY(-1px);
}

.slot-button.is-selected {
  border-color: #0f52ba;
  background: #0f52ba;
  color: #fff;
  box-shadow: 0 14px 24px rgba(15, 82, 186, 0.18);
}

.slot-button.is-booked {
  border-color: #e5e9f0;
  background: #f2f5f9;
  color: #9aa6ba;
  cursor: not-allowed;
  text-decoration: line-through;
}

.slot-button.is-off,
.slot-button.is-expired {
  border-color: #e5e9f0;
  background: #f7f9fc;
  color: #a6b1c2;
  cursor: not-allowed;
}

.slot-button.is-expired {
  text-decoration: line-through;
}

.slot-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  color: #4b5f7d;
  font-size: 12px;
  font-weight: 700;
}

.slot-legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 11px;
  height: 11px;
  border-radius: 999px;
}

.legend-dot.free {
  background: #72d392;
}

.legend-dot.selected {
  background: #0f52ba;
}

.legend-dot.unavailable {
  background: #cfd8e6;
}

.slot-empty,
.slot-empty-period {
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d8e2f0;
  border-radius: 8px;
  background: #f8fbff;
  color: #708199;
  padding: 0 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
}

.slot-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 12px;
}

.skeleton-slot {
  height: 40px;
  border-radius: 7px;
  background: linear-gradient(90deg, #f1f5f9, #e7eef7, #f1f5f9);
  background-size: 180% 100%;
  animation: slot-pulse 1.4s ease-in-out infinite;
}

.is-compact .slot-button,
.is-compact .skeleton-slot {
  height: 34px;
}

.is-compact .slot-tab {
  height: 34px;
  min-width: 106px;
  font-size: 12px;
}

@keyframes slot-pulse {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}

@media (max-width: 640px) {
  .slot-tabs {
    width: 100%;
  }

  .slot-tab {
    flex: 1;
    min-width: 0;
  }
}
</style>
