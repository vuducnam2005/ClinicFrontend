<template>
  <div>
    <div v-if="loading" class="sk"><span v-for="i in 5" :key="i" class="ss"></span></div>
    <div v-else-if="displaySlots.length" class="sw">
      <div class="se">
        <div class="sh"><svg class="su" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/></svg><span class="st">CA SÁNG</span></div>
        <div class="sg"><button v-for="s in morningSlots" :key="s" :class="['sb', cls(s)]" :disabled="!isAvail(s)" type="button" @click="pick(s)">{{ s }}</button></div>
      </div>
      <div class="se">
        <div class="sh"><svg class="sm" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><span class="st">CA CHIỀU</span></div>
        <div class="sg"><button v-for="s in afternoonSlots" :key="s" :class="['sb', cls(s)]" :disabled="!isAvail(s)" type="button" @click="pick(s)">{{ s }}</button></div>
      </div>
    </div>
    <div v-else class="em">{{ emptyMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{ slots: string[]; allSlots?: string[]; bookedSlots?: string[]; title?: string; modelValue?: string; loading?: boolean; compact?: boolean; emptyMessage?: string }>(), { allSlots: () => [], bookedSlots: () => [], title: '', modelValue: '', loading: false, compact: false, emptyMessage: 'Không có slot trống.' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const avail = computed(() => new Set(props.slots.map(n)))
const booked = computed(() => new Set(props.bookedSlots.map(n)))
const displaySlots = computed(() => { const s = props.allSlots.length ? props.allSlots : props.slots; return [...new Set(s.map(n).filter(Boolean))].sort() })
const sel = computed(() => n(props.modelValue))
const morningSlots = computed(() => displaySlots.value.filter((s) => s < '12:00'))
const afternoonSlots = computed(() => displaySlots.value.filter((s) => s >= '12:00'))
function n(s: string) { return String(s || '').slice(0, 5) }
function isAvail(s: string) { const v = n(s); return avail.value.has(v) && !booked.value.has(v) }
function isBk(s: string) { return booked.value.has(n(s)) }
function cls(s: string) { const v = n(s); if (isBk(s)) return 'bk'; if (!isAvail(s)) return 'of'; if (sel.value === v) return 'on'; return 'fr' }
function pick(s: string) { if (isAvail(s)) emit('update:modelValue', n(s)) }
</script>

<style scoped>
.sw { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.se { min-width: 0; }
.sh { display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
.su { width: 13px; height: 13px; color: #f59e0b; }
.sm { width: 13px; height: 13px; color: #6366f1; }
.st { font-size: 9.5px; font-weight: 700; color: #334155; letter-spacing: .3px; }
.sg { display: flex; flex-wrap: wrap; gap: 4px; }
.sb { min-width: 48px; height: 24px; padding: 0 4px; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; transition: all .12s; border: 1.5px solid transparent; display: inline-flex; align-items: center; justify-content: center; }
.fr { background: #fff; border-color: #e2e8f0; color: #334155; }
.fr:hover { border-color: #0F52BA; background: #eff6ff; color: #0F52BA; }
.on { background: #0F52BA; border-color: #0F52BA; color: #fff; }
.bk { background: #fef2f2; border-color: #fecaca; color: #ef4444; opacity: .5; cursor: not-allowed; text-decoration: line-through; }
.of { background: #f8fafc; border-color: #e2e8f0; color: #94a3b8; opacity: .4; cursor: not-allowed; }
.em { padding: 8px 6px; text-align: center; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 6px; font-size: 10.5px; color: #64748b; }
.sk { display: flex; flex-wrap: wrap; gap: 4px; }
.ss { width: 48px; height: 24px; border-radius: 4px; background: #f1f5f9; animation: p 1.5s ease-in-out infinite; }
@keyframes p { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
@media (max-width: 640px) { .sw { grid-template-columns: 1fr; } }
</style>
