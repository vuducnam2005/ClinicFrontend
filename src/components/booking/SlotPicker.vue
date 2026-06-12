<template>
  <div>
    <div class="mb-3 flex items-center justify-between">
      <p class="text-sm font-semibold text-slate-800">{{ title }}</p>
      <span v-if="loading" class="text-xs text-slate-500">Đang tải...</span>
    </div>

    <div v-if="loading" class="slot-wheel">
      <span v-for="item in 5" :key="item" :class="['slot-card animate-pulse border-slate-100 bg-slate-100', compact ? 'h-20 w-20' : 'h-24 w-24']"></span>
    </div>

    <div v-else-if="displaySlots.length" class="slot-stage">
      <span class="slot-needle slot-needle-top" aria-hidden="true"></span>
      <span class="slot-needle slot-needle-bottom" aria-hidden="true"></span>
      <div
        ref="scroller"
        :class="['slot-wheel', isDragging ? 'is-dragging' : '']"
        aria-label="Chọn giờ khám"
        @pointerdown="startDrag"
        @pointermove="dragSlots"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @pointerleave="endDrag"
      >
        <span class="slot-edge" aria-hidden="true"></span>
        <button
          v-for="slot in displaySlots"
          :key="slot"
          :data-slot="slot"
          :class="['slot-card', compact ? 'h-20 w-20' : 'h-24 w-24', slotClass(slot)]"
          :disabled="!isAvailable(slot)"
          type="button"
          :title="isBooked(slot) ? 'Khung giờ đã có lịch' : 'Khung giờ còn trống'"
          @click="selectSlot(slot)"
          @pointerup="selectSlotFromPointer(slot)"
        >
          <span class="text-base font-bold leading-none">{{ slot }}</span>
          <span class="mt-1 text-[11px] font-semibold leading-none">{{ isBooked(slot) ? 'Đã đặt' : 'Còn trống' }}</span>
        </button>
        <span class="slot-edge" aria-hidden="true"></span>
      </div>
    </div>

    <div v-else class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
      {{ emptyMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    slots: string[]
    allSlots?: string[]
    bookedSlots?: string[]
    title?: string
    modelValue?: string
    loading?: boolean
    compact?: boolean
    emptyMessage?: string
  }>(),
  {
    allSlots: () => [],
    bookedSlots: () => [],
    title: 'Giờ khám còn trống',
    modelValue: '',
    loading: false,
    compact: false,
    emptyMessage: 'Không có slot trống cho bác sĩ/ngày đã chọn. Hãy chọn ngày khác hoặc bác sĩ khác.',
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
const selectedSlot = computed(() => normalizeSlot(props.modelValue))
const hasSelectedSlot = computed(() => Boolean(selectedSlot.value))
const scroller = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartScroll = ref(0)
const dragMoved = ref(false)
const dragThreshold = 14
const centerSelectionFrame = ref<number | null>(null)

watch(
  () => [props.modelValue, displaySlots.value.join('|')] as const,
  () => {
    if (!selectedSlot.value) return
    void nextTick(() => scrollSlotIntoCenter(selectedSlot.value))
  },
)

function normalizeSlot(slot: string) {
  return String(slot || '').slice(0, 5)
}

function isAvailable(slot: string) {
  const value = normalizeSlot(slot)
  return availableSet.value.has(value) && !bookedSet.value.has(value)
}

function isBooked(slot: string) {
  return bookedSet.value.has(normalizeSlot(slot))
}

function slotClass(slot: string) {
  const value = normalizeSlot(slot)
  const isSelected = selectedSlot.value === value
  if (isBooked(slot)) return 'border-rose-200 bg-rose-50 text-rose-500 opacity-45 grayscale cursor-not-allowed'
  if (!isAvailable(slot)) return 'border-slate-200 bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
  if (isSelected) return 'scale-100 border-[#0F52BA] bg-[#0F52BA] text-white opacity-100 shadow-lg shadow-blue-200/70'
  return [
    'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-[#0F52BA]',
    hasSelectedSlot.value ? 'scale-90 opacity-45 hover:opacity-80' : 'opacity-100',
  ].join(' ')
}

function selectSlot(slot: string) {
  if (!isAvailable(slot)) return
  const value = normalizeSlot(slot)
  emit('update:modelValue', value)
  void nextTick(() => scrollSlotIntoCenter(value))
}

function selectSlotFromPointer(slot: string) {
  if (dragMoved.value) return
  selectSlot(slot)
}

function scrollSlotIntoCenter(slot: string) {
  const target = scroller.value?.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

function startDrag(event: PointerEvent) {
  if (!scroller.value) return
  isDragging.value = true
  dragMoved.value = false
  dragStartX.value = event.clientX
  dragStartScroll.value = scroller.value.scrollLeft
  scroller.value.setPointerCapture?.(event.pointerId)
}

function dragSlots(event: PointerEvent) {
  if (!isDragging.value || !scroller.value) return
  const delta = event.clientX - dragStartX.value
  if (Math.abs(delta) > dragThreshold) dragMoved.value = true
  scroller.value.scrollLeft = dragStartScroll.value - delta
  scheduleCenteredSlotSelection(false)
}

function endDrag(event: PointerEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  scroller.value?.releasePointerCapture?.(event.pointerId)
  selectCenteredSlot(true)
  if (dragMoved.value) {
    window.setTimeout(() => {
      dragMoved.value = false
    }, 0)
  }
}

function scheduleCenteredSlotSelection(shouldCenter: boolean) {
  if (centerSelectionFrame.value !== null) return
  centerSelectionFrame.value = window.requestAnimationFrame(() => {
    centerSelectionFrame.value = null
    selectCenteredSlot(shouldCenter)
  })
}

function selectCenteredSlot(shouldCenter: boolean) {
  const container = scroller.value
  if (!container) return

  const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-slot]'))
    .map((element) => ({
      element,
      slot: normalizeSlot(element.dataset.slot || ''),
      distance: Math.abs(
        element.offsetLeft + element.offsetWidth / 2 - (container.scrollLeft + container.clientWidth / 2),
      ),
    }))
    .filter((item) => item.slot && isAvailable(item.slot))
    .sort((a, b) => a.distance - b.distance)

  const nearest = cards[0]
  if (!nearest) return
  if (selectedSlot.value !== nearest.slot) {
    emit('update:modelValue', nearest.slot)
  }
  if (shouldCenter) {
    void nextTick(() => scrollSlotIntoCenter(nearest.slot))
  }
}
</script>

<style scoped>
.slot-wheel {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 44%;
  padding: 22px 4px;
  -webkit-overflow-scrolling: touch;
  cursor: grab;
  scrollbar-width: none;
  touch-action: pan-y;
  user-select: none;
}

.slot-stage {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  background:
    linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0) 18%, rgba(255, 255, 255, 0) 82%, #ffffff 100%),
    linear-gradient(180deg, #f8fafc 0%, #ffffff 52%, #f8fafc 100%);
}

.slot-needle {
  position: absolute;
  left: 50%;
  z-index: 2;
  height: 0;
  width: 0;
  transform: translateX(-50%);
  pointer-events: none;
}

.slot-needle-top {
  top: 6px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid #0f52ba;
}

.slot-needle-bottom {
  bottom: 6px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 10px solid #0f52ba;
}

.slot-wheel::-webkit-scrollbar {
  display: none;
}

.slot-wheel.is-dragging {
  cursor: grabbing;
  scroll-snap-type: none;
}

.slot-edge {
  flex: 0 0 max(24px, calc(50% - 48px));
}

.slot-card {
  flex: 0 0 auto;
  scroll-snap-align: center;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-radius: 18px;
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.slot-card:focus-visible {
  outline: 3px solid #bfdbfe;
  outline-offset: 3px;
}
</style>
