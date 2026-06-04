<template>
  <section class="relative min-h-[640px] overflow-hidden bg-[#f7f9fb] pt-16">
    <div class="absolute inset-0">
      <img
        class="hero-photo-motion h-full w-full object-cover opacity-55"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyRtwvy8Z_0g8e99r-EzqhWt7QHKuXCFZNIVwnS6vhQEmVlrn0EKKugW3U1XUclfMcTovrIn3KjK2MXOzIsGMcPbuvprwPBC5-xPBUaG67A1_b4ZjTl_ogmUxRNa2Yf4qEoiXK_p_dZpjLQgaySKtCpHcQlN0D4BlaR-76GGmnaYsG7DPLZddE8O4LLdAHTlq7C51FQRUyXyvtGUqKrdUw95QAhPZmhYLanSxO-na1183viqpTnY914TXzpVr_7vzGXdxfcTEvxfXS"
        alt="Sanh phong kham hien dai"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-[#f7f9fb] via-[#f7f9fb]/92 to-[#f7f9fb]/20"></div>
    </div>

    <div class="container-page relative z-10 flex min-h-[560px] items-center">
      <div class="max-w-2xl pb-20">
        <h1 class="fade-up max-w-xl text-4xl font-bold leading-tight tracking-normal text-[#003c90] sm:text-5xl">
          Chăm sóc sức khỏe tận tâm cho gia đình bạn
        </h1>
        <p class="fade-up mt-6 max-w-lg text-base leading-7 text-slate-600" style="animation-delay: 120ms">
          Trải nghiệm dịch vụ y tế chuyên nghiệp với đội ngũ bác sĩ hàng đầu. Đặt lịch khám trực tuyến nhanh chóng, tiết kiệm thời gian chờ đợi.
        </p>
        <div class="fade-up mt-8 flex flex-col gap-3 sm:flex-row" style="animation-delay: 220ms">
          <RouterLink to="/booking">
            <BaseButton class="pulse-soft w-full rounded-lg bg-[#003c90] px-6 py-3 text-white hover:bg-[#0f52ba] sm:w-auto">
              Đặt lịch khám ngay
            </BaseButton>
          </RouterLink>
          <a
            href="#services"
            class="inline-flex h-12 items-center justify-center rounded-lg border border-transparent px-6 text-sm font-semibold text-slate-600 transition hover:border-slate-200 hover:bg-white"
          >
            Xem dịch vụ của chúng tôi
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
</script>
