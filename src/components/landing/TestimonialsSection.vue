<template>
  <section id="testimonials" class="bg-[#eceef0] py-24">
    <div class="container-page">
      <div v-reveal class="mx-auto max-w-2xl text-center">
        <p class="section-eyebrow">Cảm nhận</p>
        <h2 class="section-title mt-3">Chia sẻ từ bệnh nhân</h2>
        <p class="section-subtitle mx-auto">Sự hài lòng của quý khách là động lực lớn nhất của chúng tôi.</p>
      </div>

      <div class="mt-12 grid gap-6 md:grid-cols-3">
        <article v-for="(item, index) in testimonials" :key="item.name" v-reveal class="motion-card relative rounded-lg border border-slate-200 bg-white p-7 shadow-sm" :style="{ transitionDelay: `${index * 90}ms` }">
          <Quote class="absolute -top-4 left-6 h-10 w-10 fill-[#1d59c1]/10 text-[#1d59c1]/10" />
          <p class="landing-card-body relative italic">"{{ item.quote }}"</p>
          <div class="mt-6 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-[#003c90]">{{ item.initials }}</div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{{ item.name }}</h3>
              <p class="text-xs text-slate-500">{{ item.caption }}</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Quote } from 'lucide-vue-next'

const testimonials = [
  {
    initials: 'TM',
    name: 'Trần Minh',
    caption: 'Bệnh nhân nội khoa',
    quote: 'Dịch vụ rất chuyên nghiệp, bác sĩ khám kỹ và tư vấn tận tình. Tôi rất hài lòng với quy trình đặt lịch nhanh chóng.',
  },
  {
    initials: 'HL',
    name: 'Hương Lan',
    caption: 'Phụ huynh bệnh nhi',
    quote: 'Phòng khám sạch sẽ, trang thiết bị hiện đại. Các bác sĩ nhi rất nhẹ nhàng nên bé hợp tác tốt trong suốt buổi khám.',
  },
  {
    initials: 'QN',
    name: 'Quốc Nam',
    caption: 'Bệnh nhân nha khoa',
    quote: 'Chi phí minh bạch, không phải chờ đợi lâu. Đây là địa chỉ tin cậy của gia đình tôi mỗi khi cần kiểm tra sức khỏe.',
  },
]
</script>
