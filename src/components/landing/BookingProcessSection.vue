<template>
  <section id="booking-process" class="relative overflow-hidden bg-white py-24">
    <div class="absolute inset-x-0 top-1/2 h-56 -translate-y-1/2 bg-blue-50/60"></div>
    <div class="container-page relative">
      <div v-reveal class="mx-auto max-w-2xl text-center">
        <p class="section-eyebrow">Quy trình</p>
        <h2 class="section-title mt-3">Đặt lịch khám trong 4 bước</h2>
        <p class="section-subtitle mx-auto">
          Quy trình được tối giản để bạn chọn đúng chuyên khoa, đúng bác sĩ và xác nhận lịch khám nhanh chóng.
        </p>
      </div>

      <div v-reveal class="mt-14 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_24px_70px_rgba(15,82,186,0.10)] lg:p-8">
        <div class="relative grid gap-4 lg:grid-cols-4">
          <div class="absolute left-[12%] right-[12%] top-12 hidden h-1 rounded-full bg-gradient-to-r from-[#003c90] via-blue-300 to-[#003c90] lg:block"></div>

          <div
            v-for="(step, index) in steps"
            :key="step.title"
            v-reveal
            class="group relative rounded-xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_42px_rgba(0,60,144,0.14)]"
            :style="{ transitionDelay: `${index * 90}ms` }"
          >
            <div class="flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
              <div class="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[6px] border-blue-50 bg-[#003c90] text-2xl font-bold text-white shadow-[0_14px_34px_rgba(0,60,144,0.24)] transition group-hover:scale-105">
                {{ index + 1 }}
              </div>

              <div class="min-w-0">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1d59c1] lg:mx-auto lg:mt-2">
                  <component :is="step.icon" class="h-5 w-5" />
                </div>
                <h3 class="landing-card-title mt-4">{{ step.title }}</h3>
                <p class="landing-card-body mt-2">{{ step.description }}</p>
              </div>
            </div>

            <div v-if="index < steps.length - 1" class="absolute left-8 top-[5.25rem] h-8 w-px bg-blue-100 lg:hidden"></div>
            <div v-if="index < steps.length - 1" class="absolute -right-5 top-10 z-20 hidden h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-white text-[#1d59c1] shadow-sm lg:flex">
              <ArrowRight class="h-4 w-4" />
            </div>
          </div>
        </div>

        <div class="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl bg-[#f7f9fb] px-5 py-4 sm:flex-row">
          <p class="text-sm text-slate-600">
            Sẵn sàng chọn lịch khám phù hợp với bạn?
          </p>
          <RouterLink
            to="/booking"
            class="inline-flex h-11 items-center justify-center rounded-lg bg-[#003c90] px-5 text-sm font-semibold text-white transition hover:bg-[#0f52ba]"
          >
            Bắt đầu đặt lịch
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ArrowRight, CalendarClock, CheckCircle2, SearchCheck, Stethoscope } from 'lucide-vue-next'

const steps: Array<{ title: string; description: string; icon: Component }> = [
  {
    title: 'Chọn chuyên khoa',
    description: 'Xác định nhu cầu khám và chọn đúng chuyên khoa phù hợp.',
    icon: Stethoscope,
  },
  {
    title: 'Chọn bác sĩ',
    description: 'Xem bác sĩ đang phụ trách và chọn người bạn muốn thăm khám.',
    icon: SearchCheck,
  },
  {
    title: 'Kiểm tra lịch trống',
    description: 'Chọn ngày khám, hệ thống trả về các khung giờ còn khả dụng.',
    icon: CalendarClock,
  },
  {
    title: 'Xác nhận đặt lịch',
    description: 'Kiểm tra thông tin và hoàn tất lịch hẹn chỉ trong vài bước.',
    icon: CheckCircle2,
  },
]
</script>
