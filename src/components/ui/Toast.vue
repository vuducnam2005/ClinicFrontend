<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-3 opacity-0"
  >
    <div
      v-if="show"
      class="fixed bottom-5 right-5 z-[70] max-w-sm rounded-xl border bg-white p-4 shadow-soft"
      :class="toneClasses"
      role="status"
    >
      <div class="flex gap-3">
        <CheckCircle2 v-if="type === 'success'" class="mt-0.5 h-5 w-5 text-teal-600" />
        <AlertCircle v-else class="mt-0.5 h-5 w-5 text-rose-600" />
        <div>
          <p class="font-semibold text-slate-950">{{ title }}</p>
          <p v-if="message" class="mt-1 text-sm leading-6 text-slate-600">{{ message }}</p>
        </div>
        <button class="ml-2 rounded-md p-1 text-slate-400 hover:bg-slate-100" @click="$emit('close')">
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { AlertCircle, CheckCircle2, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    show: boolean
    title: string
    message?: string
    type?: 'success' | 'error'
  }>(),
  {
    type: 'success',
    message: '',
  },
)

const emit = defineEmits<{
  close: []
}>()

const toneClasses = computed(() =>
  props.type === 'success' ? 'border-teal-100' : 'border-rose-100',
)

let closeTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.show,
  (show) => {
    if (closeTimer) clearTimeout(closeTimer)
    if (show) {
      closeTimer = setTimeout(() => {
        emit('close')
      }, 3000)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer)
})
</script>
