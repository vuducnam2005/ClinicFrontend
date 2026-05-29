<template>
 <section class="section-pad bg-white ">
 <div class="container-page">
 <!-- Section Header -->
 <div v-reveal class="mx-auto max-w-2xl text-center mb-16">
 <span class="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-500/10 px-3 py-1 rounded-full">
 Phản hồi từ bệnh nhân
 </span>
 <h2 class="section-title mt-4">Trải nghiệm chăm sóc sức khỏe vượt trội</h2>
 <p class="section-subtitle mx-auto mt-3 text-base">
 Ý kiến thực tế từ những người đã trải nghiệm dịch vụ điều phối thông minh của ClinicCare.
 </p>
 </div>

 <!-- Testimonial List Grid + Performance metrics card -->
 <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
 
 <!-- Testimonial 1 -->
 <div v-reveal class="rounded-3xl p-8 border border-slate-100 bg-slate-50 shadow-soft flex flex-col justify-between">
 <div>
 <!-- Stars row -->
 <div class="flex items-center gap-1 text-amber-500 mb-4">
 <Star v-for="i in 5" :key="i" class="h-4.5 w-4.5 fill-current" />
 </div>
 <p class="text-sm leading-relaxed text-slate-600 italic">
 "Quy trình xếp hàng lấy số thứ tự ở đây cực kỳ thông minh. Tôi chỉ cần ngồi đợi tại quán cafe gần phòng khám và theo dõi trạng thái hàng chờ ngay trên điện thoại di động, cực kỳ thong thả."
 </p>
 </div>
 <div class="mt-6 flex items-center gap-3">
 <div class="h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 font-bold">M</div>
 <div>
 <h4 class="text-sm font-bold text-slate-900 ">Chị Nguyễn Thị Mai</h4>
 <p class="text-xxs text-slate-400 ">Khám Nhi khoa • 28 tuổi</p>
 </div>
 </div>
 </div>

 <!-- Testimonial 2 -->
 <div v-reveal style="animation-delay: 100ms" class="rounded-3xl p-8 border border-slate-100 bg-slate-50 shadow-soft flex flex-col justify-between">
 <div>
 <div class="flex items-center gap-1 text-amber-500 mb-4">
 <Star v-for="i in 5" :key="i" class="h-4.5 w-4.5 fill-current" />
 </div>
 <p class="text-sm leading-relaxed text-slate-600 italic">
 "Lịch sử bệnh án và các chẩn đoán từ bác sĩ đều được cập nhật tức thì. Nhờ vậy tôi có thể tra cứu nhanh các đơn thuốc cũ mà không cần lật lại đống giấy tờ y tế rắc rối như trước."
 </p>
 </div>
 <div class="mt-6 flex items-center gap-3">
 <div class="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-600 font-bold">H</div>
 <div>
 <h4 class="text-sm font-bold text-slate-900 ">Anh Trần Quang Hải</h4>
 <p class="text-xxs text-slate-400 ">Khám Tim mạch • 45 tuổi</p>
 </div>
 </div>
 </div>

 <!-- Metrics Card for OS trust building -->
 <div v-reveal style="animation-delay: 200ms" class="rounded-3xl p-8 border border-teal-100 bg-teal-50/20 shadow-medical flex flex-col justify-between">
 <div class="space-y-4">
 <h3 class="text-lg font-bold text-teal-800 uppercase tracking-wider">Chỉ số vận hành lâm sàng</h3>
 <div class="grid grid-cols-2 gap-4">
 <div>
 <p class="text-xxs font-bold text-slate-400 uppercase tracking-wider">Hài lòng</p>
 <p class="text-2xl font-extrabold text-teal-700 ">99.2%</p>
 </div>
 <div>
 <p class="text-xxs font-bold text-slate-400 uppercase tracking-wider">Uptime</p>
 <p class="text-2xl font-extrabold text-teal-700 ">99.9%</p>
 </div>
 <div>
 <p class="text-xxs font-bold text-slate-400 uppercase tracking-wider">Đúng giờ</p>
 <p class="text-2xl font-extrabold text-teal-700 ">98.5%</p>
 </div>
 <div>
 <p class="text-xxs font-bold text-slate-400 uppercase tracking-wider">Số ca phục vụ</p>
 <p class="text-2xl font-extrabold text-teal-700 ">15k+</p>
 </div>
 </div>
 </div>
 <div class="mt-6 flex items-center gap-2 text-xxs font-bold text-teal-600 ">
 <ShieldCheck class="h-4.5 w-4.5 animate-pulse" />
 KIỂM TOÁN VẬN HÀNH THỜI GIAN THỰC
 </div>
 </div>

 </div>
 </div>
 </section>
</template>

<script setup lang="ts">
import { Star, ShieldCheck } from 'lucide-vue-next'
</script>

<style scoped>
.text-xxs {
 font-size: 0.68rem;
}
.text-xxs {
 font-size: 0.65rem;
}
</style>
