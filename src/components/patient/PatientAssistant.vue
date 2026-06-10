<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
    <!-- Chat Window -->
    <transition name="chat-fade">
      <div
        v-if="chatOpen"
        class="mb-4 flex h-[480px] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl transition-all duration-300 pointer-events-auto"
      >
        <!-- Header -->
        <div class="flex items-center justify-between bg-[#0F52BA] px-4 py-3.5 text-white">
          <div class="flex items-center gap-3">
            <div class="relative">
              <video autoplay loop muted playsinline preload="auto" class="h-10 w-10 rounded-full border border-white/20 bg-transparent object-contain">
                <source :src="assistantWebm + '?v=7'" type="video/webm" />
              </video>
              <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0F52BA] bg-emerald-500"></span>
            </div>
            <div>
              <h3 class="text-sm font-bold leading-tight">Dr. Doggy</h3>
              <p class="text-[10px] font-semibold text-blue-100">Trợ lý ảo Medicare · Đang hoạt động</p>
            </div>
          </div>
          <button type="button" class="rounded-lg p-1.5 hover:bg-white/10" @click="chatOpen = false">
            <Minus class="h-4 w-4" />
          </button>
        </div>

        <!-- Messages Body -->
        <div ref="messagesRef" class="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
          <div v-for="(msg, idx) in messages" :key="idx" class="flex items-start gap-2.5" :class="msg.sender === 'patient' ? 'flex-row-reverse' : ''">
            <!-- Avatar for bot -->
            <img
              v-if="msg.sender === 'bot'"
              :src="assistantDogPng"
              alt="Avatar"
              class="h-8 w-8 rounded-full border border-slate-200 bg-white object-contain"
            />
            
            <div class="max-w-[75%]">
              <div
                class="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                :class="
                  msg.sender === 'patient'
                    ? 'bg-[#0F52BA] text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'
                "
              >
                {{ msg.text }}
              </div>
              <span class="mt-1 block text-[10px] text-slate-400" :class="msg.sender === 'patient' ? 'text-right' : ''">
                {{ msg.time }}
              </span>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="flex items-start gap-2.5">
            <img :src="assistantDogPng" alt="Avatar" class="h-8 w-8 rounded-full border border-slate-200 bg-white object-contain" />
            <div class="rounded-2xl bg-white border border-slate-100 px-4 py-3.5 shadow-sm rounded-tl-none flex gap-1.5 items-center">
              <span class="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay: 0ms"></span>
              <span class="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay: 150ms"></span>
              <span class="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay: 300ms"></span>
            </div>
          </div>
        </div>

        <!-- Quick Options -->
        <div v-if="messages.length === 1 && !isTyping" class="bg-slate-50 px-4 pb-3 pt-1 flex flex-wrap gap-2">
          <button
            v-for="opt in quickOptions"
            :key="opt.text"
            type="button"
            class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-[#0F52BA]"
            @click="selectQuickOption(opt)"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Input Area -->
        <form @submit.prevent="sendMessage" class="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3">
          <input
            v-model="inputMsg"
            type="text"
            placeholder="Hỏi Dr. Doggy về dịch vụ..."
            class="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            :disabled="!inputMsg.trim()"
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F52BA] text-white shadow-md transition hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            <Send class="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </transition>

    <!-- Dog Button -->
    <div class="relative flex flex-col items-end">
      <!-- Speech bubble tooltip (only when chat is closed and tooltip is visible) -->
      <transition name="bubble-fade">
        <div
          v-if="!chatOpen && showTooltip"
          class="absolute bottom-28 right-2 z-10 w-44 rounded-2xl bg-white p-3 text-center text-xs font-semibold text-slate-800 shadow-lg border border-slate-100 select-none animate-float pointer-events-auto"
        >
          <button
            type="button"
            class="absolute right-1.5 top-1.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            @click.stop="showTooltip = false"
          >
            <X class="h-3 w-3" />
          </button>
          <p class="pr-2 text-left leading-normal">Bạn cần giúp gì không gâu? 🐶</p>
          <!-- Small Speech bubble arrow -->
          <div class="absolute -bottom-2 right-6 h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-white"></div>
        </div>
      </transition>

      <!-- Dog Avatar Button (no border/bg, character stands directly on page) -->
      <button
        type="button"
        class="dog-avatar-btn group pointer-events-auto flex h-32 w-auto items-center justify-center transition-all duration-300 focus:outline-none"
        @click="toggleChat"
      >
        <video
          autoplay
          loop
          muted
          playsinline
          preload="auto"
          aria-label="Dr. Doggy"
          class="dog-img h-full w-auto bg-transparent object-contain transition duration-300"
        >
          <source :src="assistantWebm + '?v=7'" type="video/webm" />
        </video>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Send, X, Minus } from 'lucide-vue-next'
import assistantDogPng from '@/assets/assistant-dog.png'
import assistantWebm from '@/assets/assistant.webm'

interface Message {
  sender: 'bot' | 'patient'
  text: string
  time: string
}

const chatOpen = ref(false)
const showTooltip = ref(true)
const inputMsg = ref('')
const isTyping = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

const messages = ref<Message[]>([
  {
    sender: 'bot',
    text: 'Gâu gâu! Xin chào! Tôi là bác sĩ cún Dr. Doggy, trợ lý ảo Medicare của bạn đây ạ. Bạn có cần tôi giúp gì không gâu? 🐶🩺',
    time: formatTime(new Date()),
  },
])

const quickOptions = [
  { label: 'Đặt lịch khám thế nào?', text: 'đặt lịch khám' },
  { label: 'Xem đơn thuốc ở đâu?', text: 'đơn thuốc' },
  { label: 'Xem hóa đơn viện phí?', text: 'viện phí' },
  { label: 'Xem hồ sơ bệnh án?', text: 'hồ sơ bệnh án' },
]

function formatTime(date: Date): string {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function toggleChat() {
  chatOpen.value = !chatOpen.value
  if (chatOpen.value) {
    showTooltip.value = false
    scrollToBottom()
  }
}

function selectQuickOption(opt: { label: string; text: string }) {
  inputMsg.value = opt.label
  sendMessage()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

watch(isTyping, () => {
  scrollToBottom()
})

function sendMessage() {
  const text = inputMsg.value.trim()
  if (!text) return

  // Push patient message
  messages.value.push({
    sender: 'patient',
    text,
    time: formatTime(new Date()),
  })
  inputMsg.value = ''

  // Trigger typing indicator
  isTyping.value = true

  setTimeout(() => {
    isTyping.value = false
    const reply = getBotReply(text)
    messages.value.push({
      sender: 'bot',
      text: reply,
      time: formatTime(new Date()),
    })
  }, 1000)
}

function getBotReply(inputText: string): string {
  const query = inputText.toLowerCase()
  if (query.includes('đặt lịch') || query.includes('hẹn') || query.includes('khám') || query.includes('booking')) {
    return 'Gâu gâu! Để đặt lịch khám bệnh, bạn vui lòng nhấn vào phần "Đặt lịch khám" ở danh mục bên trái màn hình nhé ạ. Tôi luôn sẵn lòng gâu gâu! 📅🐶'
  }
  if (query.includes('đơn thuốc') || query.includes('thuốc') || query.includes('prescription')) {
    return 'Dạ gâu! Bạn có thể xem toàn bộ danh sách đơn thuốc đã kê tại mục "Đơn thuốc" ở danh mục dịch vụ bên trái nha. Hihi! 💊🐕'
  }
  if (query.includes('hóa đơn') || query.includes('viện phí') || query.includes('tiền') || query.includes('bill') || query.includes('thanh toán')) {
    return 'Gâu gâu! Các hóa đơn và viện phí của bạn nằm gọn trong mục "Viện phí" ở menu bên trái đó ạ. Bạn có thể xem chi tiết trạng thái thanh toán gâu gâu! 💳🐶'
  }
  if (query.includes('bệnh án') || query.includes('hồ sơ') || query.includes('record') || query.includes('lịch sử')) {
    return 'Hồ sơ sức khỏe của bạn được bảo mật rất kỹ trong phần "Hồ sơ bệnh án" bên trái nha gâu! Hãy vào đó xem chi tiết gâu! 📁🐶'
  }
  if (query.includes('chào') || query.includes('hi') || query.includes('hello')) {
    return 'Gâu gâu! Xin chào! Tôi rất vui được gặp bạn. Chúc bạn một ngày ngập tràn niềm vui và sức khỏe gâu! 🐶❤️'
  }
  return 'Gâu gâu! Tôi chưa hiểu câu hỏi của bạn lắm, nhưng tôi là trợ lý cún con luôn sẵn sàng dẫn đường cho bạn. Bạn có muốn xem mục Đặt lịch khám, Đơn thuốc, hay Viện phí không gâu? 🐕🩺'
}
</script>

<style scoped>
/* Float animation for bubble */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
.animate-float {
  animation: float 2s infinite ease-in-out;
}

/* Float animation for the dog button */
@keyframes float-dog {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
.dog-avatar-btn {
  animation: float-dog 3s infinite ease-in-out;
}

/* Wiggle animation on hover */
@keyframes dog-wiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-3deg);
  }
  75% {
    transform: rotate(3deg);
  }
}
.dog-avatar-btn:hover .dog-img {
  animation: dog-wiggle 0.5s infinite ease-in-out;
}
.dog-avatar-btn:active {
  transform: scale(0.95);
}

/* Transitions */
.chat-fade-enter-active,
.chat-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.chat-fade-enter-from,
.chat-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.bubble-fade-enter-active,
.bubble-fade-leave-active {
  transition: opacity 0.2s ease;
}
.bubble-fade-enter-from,
.bubble-fade-leave-to {
  opacity: 0;
}
</style>
