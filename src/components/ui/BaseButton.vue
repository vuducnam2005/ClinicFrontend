<template>
  <button
    :type="type"
   :disabled="disabled || loading"
   :class="[
      'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
      sizeClasses,
      variantClasses,
    ]"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
    <slot name="icon" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
  },
)

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
  }
  return sizes[props.size]
})

const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-teal-600 text-white shadow-card hover:bg-teal-700 focus:ring-teal-100',
    secondary: 'bg-slate-900 text-white shadow-card hover:bg-slate-800 focus:ring-slate-200',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-100',
    outline:
      'border border-slate-200 bg-white text-slate-800 hover:border-teal-200 hover:bg-teal-50 focus:ring-teal-100',
  }
  return variants[props.variant]
})
</script>
