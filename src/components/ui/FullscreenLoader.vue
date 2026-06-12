<template>
  <Transition name="fullscreen-loader" appear>
    <div
      v-if="visible"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-white/70"
      role="status"
      aria-live="polite"
      aria-label="Đang tải dữ liệu"
    >
      <div class="fullscreen-loader__content flex flex-col items-center text-[#0F52BA]">
        <LoaderCircle class="h-8 w-8 animate-spin" />
        <p class="mt-3 text-sm font-medium text-slate-600">Loading...</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
}>()

const minimumVisibleMs = 450
const visible = ref(props.show)
let shownAt = props.show ? Date.now() : 0
let hideTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.show,
  (show) => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    if (show) {
      shownAt = Date.now()
      visible.value = true
      return
    }

    const remaining = Math.max(minimumVisibleMs - (Date.now() - shownAt), 0)
    hideTimer = setTimeout(() => {
      visible.value = false
      hideTimer = null
    }, remaining)
  },
)

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<style scoped>
.fullscreen-loader-enter-active,
.fullscreen-loader-leave-active {
  transition: opacity 200ms ease;
}

.fullscreen-loader-enter-active .fullscreen-loader__content,
.fullscreen-loader-leave-active .fullscreen-loader__content {
  transition: opacity 180ms ease, transform 200ms ease;
}

.fullscreen-loader-enter-from,
.fullscreen-loader-leave-to,
.fullscreen-loader-enter-from .fullscreen-loader__content,
.fullscreen-loader-leave-to .fullscreen-loader__content {
  opacity: 0;
}

.fullscreen-loader-enter-from .fullscreen-loader__content {
  transform: translateY(6px);
}

.fullscreen-loader-leave-to .fullscreen-loader__content {
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .fullscreen-loader-enter-active,
  .fullscreen-loader-leave-active,
  .fullscreen-loader-enter-active .fullscreen-loader__content,
  .fullscreen-loader-leave-active .fullscreen-loader__content {
    transition-duration: 1ms;
  }
}
</style>
