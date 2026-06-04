<template>
  <label class="block">
    <span v-if="label" class="mb-2 block text-sm font-medium text-slate-700">{{ label }}</span>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :min="min"
     :class="[
        'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F52BA] focus:ring-4 focus:ring-blue-100',
        error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : '',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="mt-1 block text-xs text-rose-600">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    type?: string
    placeholder?: string
    required?: boolean
    min?: string | number
    error?: string
  }>(),
  {
    modelValue: '',
    type: 'text',
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
