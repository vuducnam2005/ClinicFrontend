<template>
  <label class="block">
    <span v-if="label" class="mb-2 block text-sm font-medium text-slate-700">{{ label }}</span>
    <select
      :value="modelValue"
      :required="required"
      class="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#0F52BA] focus:ring-4 focus:ring-blue-100"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
export interface SelectOption {
  label: string
  value: string | number
}

withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    placeholder?: string
    required?: boolean
    options: SelectOption[]
  }>(),
  {
    modelValue: '',
    placeholder: 'Chon',
    required: false,
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
