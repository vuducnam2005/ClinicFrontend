<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
    <!-- Chat Window -->
    <transition name="chat-fade">
      <div
        class="mb-4 flex h-[480px] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl transition-all duration-300 pointer-events-auto"
      >
        <!-- Header -->
        <div class="flex items-center justify-between bg-[#0F52BA] px-4 py-3.5 text-white">
          <div class="flex items-center gap-3">
            <div>
              <h3 class="text-sm font-bold leading-tight">Trợ lý Medicare</h3>
              <p class="text-[10px] font-semibold text-blue-100">Trợ lý ảo Medicare · Đang hoạt động</p>
            </div>
          </div>
        </div>

        <!-- Messages Body -->
        <div ref="messagesRef" class="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
          <div v-for="(msg, idx) in messages" :key="idx" class="flex items-start gap-2.5" :class="msg.sender === 'patient' ? 'flex-row-reverse' : ''">
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
            placeholder="Hỏi trợ lý về dịch vụ..."
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
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Send } from 'lucide-vue-next'

interface Message {
  sender: 'bot' | 'patient'
  text: string
  time: string
}

const inputMsg = ref('')
const isTyping = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

const messages = ref<Message[]>([
  {
    sender: 'bot',
    text: 'Xin chào! Tôi là trợ lý ảo Medicare của bạn đây ạ. Bạn có cần tôi giúp gì không?',
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
    return 'Để đặt lịch khám bệnh, bạn vui lòng nhấn vào phần "Đặt lịch khám" ở danh mục bên trái màn hình nhé ạ.'
  }
  if (query.includes('đơn thuốc') || query.includes('thuốc') || query.includes('prescription')) {
    return 'Bạn có thể xem toàn bộ danh sách đơn thuốc đã kê tại mục "Đơn thuốc" ở danh mục dịch vụ bên trái nha.'
  }
  if (query.includes('hóa đơn') || query.includes('viện phí') || query.includes('tiền') || query.includes('bill') || query.includes('thanh toán')) {
    return 'Các hóa đơn và viện phí của bạn nằm trong mục "Viện phí" ở menu bên trái. Bạn có thể xem chi tiết trạng thái thanh toán tại đó.'
  }
  if (query.includes('bệnh án') || query.includes('hồ sơ') || query.includes('record') || query.includes('lịch sử')) {
    return 'Hồ sơ sức khỏe của bạn nằm trong phần "Hồ sơ bệnh án" bên trái. Hãy vào đó để xem chi tiết nhé.'
  }
  if (query.includes('chào') || query.includes('hi') || query.includes('hello')) {
    return 'Xin chào! Tôi rất vui được gặp bạn. Chúc bạn một ngày nhiều sức khỏe.'
  }
  return 'Tôi chưa hiểu câu hỏi của bạn lắm, nhưng tôi luôn sẵn sàng dẫn đường cho bạn. Bạn có muốn xem mục Đặt lịch khám, Đơn thuốc, hay Viện phí không?'
}
</script>

<style scoped>
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

</style>
