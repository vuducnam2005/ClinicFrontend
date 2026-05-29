<template>
  <div>
    <div class="mb-3 flex items-center justify-between">
      <p class="text-sm font-semibold text-slate-800">Giờ khám còn trống</p>
      <span v-if="loading" class="text-xs text-slate-500">Đang tải...</span>
    </div>

    <div v-if="loading" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <span v-for="item in 5" :key="item" class="h-10 animate-pulse rounded-lg bg-slate-100"></span>
    </div>

    <div v-else-if="slots.length" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <button
        v-for="slot in slots"
        :key="slot"
        class="h-10 rounded-lg border text-sm font-semibold transition"
       :class="
          modelValue === slot
            ? 'border-teal-600 bg-teal-600 text-white shadow-card'
            : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50'
        "
        type="button"
        @click="$emit('update:modelValue', slot)"
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
withDefaults(
  defineProps<{
    slots: string[]
    modelValue?: string
    loading?: boolean
  }>(),
  {
    modelValue: '',
    loading: false,
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>