<template>
  <div>
    <div class="mb-3 flex items-center justify-between">
      <p class="text-sm font-semibold text-slate-800">Giờ khám còn trống</p>
      <span v-if="loading" class="text-xs text-slate-500">Đang tải...</span>
    </div>

    <div v-if="loading" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <span v-for="item in 5" :key="item" class="h-10 animate-pulse rounded-lg bg-slate-100"></span>
    </div>

    <div v-else-if="displaySlots.length" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <button
        v-for="slot in displaySlots"
        :key="slot"
        class="h-10 rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed"
        :class="slotClass(slot)"
        :disabled="!isAvailable(slot)"
        type="button"
        @click="selectSlot(slot)"
      >
        {{ slot }}
      </button>
    </div>

    <div v-else class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
      Không có slot trống cho bác sĩ/ngày đã chọn. Hãy chọn ngày khác hoặc bác sĩ khác.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    slots: string[]
    allSlots?: string[]
    bookedSlots?: string[]
    modelValue?: string
    loading?: boolean
  }>(),
  {
    allSlots: () => [],
    bookedSlots: () => [],
    modelValue: '',
    loading: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const availableSet = computed(() => new Set(props.slots.map(normalizeSlot)))
const bookedSet = computed(() => new Set(props.bookedSlots.map(normalizeSlot)))
const displaySlots = computed(() => {
  const source = props.allSlots.length ? props.allSlots : props.slots
  return Array.from(new Set(source.map(normalizeSlot).filter(Boolean))).sort((a, b) => a.localeCompare(b))
})

function normalizeSlot(slot: string) {
  return String(slot || '').slice(0, 5)
}

function isAvailable(slot: string) {
  const value = normalizeSlot(slot)
  return availableSet.value.has(value) && !bookedSet.value.has(value)
}

function slotClass(slot: string) {
  if (!isAvailable(slot)) return 'border-slate-200 bg-slate-100 text-slate-400 opacity-80'
  if (props.modelValue === slot) return 'border-[#0F52BA] bg-[#0F52BA] text-white shadow-card'
  return 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
}

function selectSlot(slot: string) {
  if (!isAvailable(slot)) return
  emit('update:modelValue', slot)
}
</script>
