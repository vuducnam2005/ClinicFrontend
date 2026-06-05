<template>
  <section id="why-us" class="bg-[#eef1f4] py-24">
    <div class="container-page grid gap-14 lg:grid-cols-2 lg:items-center">
      <div v-reveal class="relative">
        <img
          class="h-[420px] w-full rounded-lg object-cover shadow-xl"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSJsNPLjVVVr0BCWPtsjy3ybKbhLrlQHcAmaTK6uKbe6JmbIXFRZI87ekeEXOpUZRLdCYJn1zuWUGrmxA3pig3ZocPFAFmQVZTEM7mYQBdlNN-ediOxzy6SZPtMZTkzwpAGrAJGg6ZugKgbTVOEY4Ou4UDxlGtIC6niFNpWomlaJ4wS4ipBguPYH46ARN8D_p7nW4oEmAqKoNoMGgssTwRbWtJTJRZ9gECi1Hvlhe2sjaMxgAXicNMmeXPRQEwAhbIsxAPzSaspx_r"
          alt="Thiet bi y te hien dai"
        />
        <div class="float-soft absolute -bottom-6 right-6 rounded-lg bg-[#003c90] px-7 py-5 text-white shadow-lg">
          <p class="text-3xl font-bold">15+</p>
          <p class="mt-1 text-xs font-semibold">Năm kinh nghiệm</p>
        </div>
      </div>

      <div v-reveal>
        <p class="section-eyebrow">Lý do lựa chọn</p>
        <h2 class="section-title mt-3">Tại sao chọn MedicareDNU?</h2>
        <div class="mt-8 space-y-7">
          <div v-for="(item, index) in reasons" :key="item.title" v-reveal class="flex gap-4" :style="{ transitionDelay: `${index * 90}ms` }">
            <div class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#1d59c1]">
              <component :is="item.icon" class="h-5 w-5" />
            </div>
            <div>
              <h3 class="landing-card-title">{{ item.title }}</h3>
              <p class="landing-card-body mt-2">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CalendarCheck, Microscope, UsersRound } from 'lucide-vue-next'

const reasons = [
  {
    title: 'Đội ngũ bác sĩ chuyên gia',
    description: 'Các bác sĩ giàu kinh nghiệm, luôn tận tâm với từng bệnh nhân.',
    icon: UsersRound,
  },
  {
    title: 'Trang thiết bị hiện đại',
    description: 'Sở hữu hệ thống máy móc chẩn đoán hình ảnh và xét nghiệm tiên tiến.',
    icon: Microscope,
  },
  {
    title: 'Đặt lịch nhanh chóng',
    description: 'Hệ thống đặt lịch thông minh giúp bạn chủ động thời gian và giảm chờ đợi.',
    icon: CalendarCheck,
  },
]
</script>
