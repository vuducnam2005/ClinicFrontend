<template>
  <section id="services" class="bg-[#f7f9fb] py-20">
    <div class="container-page">
      <div v-reveal class="text-center">
        <p class="section-eyebrow">Dịch vụ</p>
        <h2 class="section-title mt-3">Dịch vụ y tế chuyên nghiệp</h2>
      </div>

      <div v-if="loading" class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <LoadingSkeleton v-for="item in 4" :key="item" class="h-48 rounded-lg" />
      </div>

      <div v-else class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(specialty, index) in displayedSpecialties"
          :key="specialty.specialtyId"
          v-reveal
          class="motion-card rounded-lg border border-slate-200 bg-white p-7"
          :style="{ transitionDelay: `${index * 80}ms` }"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded bg-blue-50 text-[#1d59c1]">
            <component :is="icons[index % icons.length]" class="h-5 w-5" />
          </div>
          <h3 class="landing-card-title mt-6">{{ displayText(specialty.specialtyName) }}</h3>
          <p class="landing-card-body mt-3">
            {{ descriptions[index % descriptions.length] }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { Baby, HeartPulse, Stethoscope, SmilePlus } from 'lucide-vue-next'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue'
import { appointmentApi } from '@/services/appointmentApi'
import { fallbackSpecialties } from '@/services/fallbackData'
import type { Specialty } from '@/types/specialty'
import { displayText } from '@/utils/displayText'

const specialties = ref<Specialty[]>([])
const loading = ref(true)
const icons: Component[] = [Stethoscope, Baby, HeartPulse, SmilePlus]
const descriptions = [
  'Khám và điều trị các bệnh lý nội khoa phổ biến cho mọi lứa tuổi.',
  'Chăm sóc sức khỏe toàn diện cho trẻ em với sự tận tâm và nhẹ nhàng.',
  'Chẩn đoán và điều trị chuyên sâu các bệnh lý về tim mạch và huyết áp.',
  'Dịch vụ chăm sóc răng miệng thẩm mỹ và điều trị kỹ thuật cao.',
]

const displayedSpecialties = computed(() => specialties.value.slice(0, 4))

onMounted(async () => {
  try {
    const data = await appointmentApi.getSpecialties()
    specialties.value = data.length ? data : fallbackSpecialties
  } catch {
    specialties.value = fallbackSpecialties
  } finally {
    loading.value = false
  }
})
</script>
