<template>
  <div class="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end font-sans sm:bottom-6 sm:right-6">
    <!-- Chat Window -->
    <transition name="chat-fade">
      <div
        v-if="chatOpen"
        class="mb-3 flex h-[min(480px,calc(100vh-13rem))] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl transition-all duration-300 pointer-events-auto"
      >
        <!-- Header -->
        <div class="flex items-center justify-between bg-[#0F52BA] px-4 py-3.5 text-white">
          <div class="flex items-center gap-3">
            <div>
              <h3 class="text-sm font-bold leading-tight">Trợ lý Medicare</h3>
              <p class="text-[10px] font-semibold text-blue-100">Trợ lý ảo Medicare · Đang hoạt động</p>
            </div>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-blue-50 transition hover:bg-white/10"
            aria-label="Đóng trợ lý Medicare"
            @click="chatOpen = false"
          >
            <X class="h-4.5 w-4.5" />
          </button>
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

    <button
      type="button"
      class="group flex flex-col items-center gap-0 rounded-2xl outline-none pointer-events-auto"
      aria-label="Mở trợ lý Medicare"
      @click="openChat"
    >
      <span
        class="relative z-10 translate-y-3 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-[#003c90] shadow-lg transition group-hover:translate-y-2 group-hover:border-blue-200 group-hover:text-[#0F52BA]"
      >
        Tôi có thể giúp gì cho bạn?
        <span class="absolute -bottom-1.5 right-9 h-3 w-3 rotate-45 border-b border-r border-blue-100 bg-white"></span>
      </span>
      <span class="relative flex h-28 w-28 items-end justify-center drop-shadow-[0_18px_30px_rgba(15,82,186,0.22)] transition duration-200 group-hover:scale-[1.03] sm:h-32 sm:w-32">
        <video
          ref="primaryAssistantVideoRef"
          :src="assistantVideoUrl"
          class="absolute inset-0 h-full w-full object-contain transition-opacity duration-[420ms]"
          :class="activeAssistantVideo === 0 ? 'opacity-100' : 'opacity-0'"
          autoplay
          muted
          playsinline
          preload="auto"
          aria-hidden="true"
          @timeupdate="handleAssistantTimeUpdate(0)"
          @ended="handleAssistantEnded(0)"
        ></video>
        <video
          ref="secondaryAssistantVideoRef"
          :src="assistantVideoUrl"
          class="absolute inset-0 h-full w-full object-contain transition-opacity duration-[420ms]"
          :class="activeAssistantVideo === 1 ? 'opacity-100' : 'opacity-0'"
          muted
          playsinline
          preload="auto"
          aria-hidden="true"
          @timeupdate="handleAssistantTimeUpdate(1)"
          @ended="handleAssistantEnded(1)"
        ></video>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Send, X } from 'lucide-vue-next'
import assistantVideoUrl from '@/assets/assistant.webm'

interface Message {
  sender: 'bot' | 'patient'
  text: string
  time: string
}

const inputMsg = ref('')
const isTyping = ref(false)
const chatOpen = ref(false)
const messagesRef = ref<HTMLElement | null>(null)
const primaryAssistantVideoRef = ref<HTMLVideoElement | null>(null)
const secondaryAssistantVideoRef = ref<HTMLVideoElement | null>(null)
const activeAssistantVideo = ref<0 | 1>(0)

const loopBlendMs = 420
const loopTriggerSeconds = 0.48
let loopBlendTimer: number | undefined

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

function openChat() {
  chatOpen.value = true
  scrollToBottom()
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

watch(isTyping, () => {
  scrollToBottom()
})

onBeforeUnmount(() => {
  if (loopBlendTimer) window.clearTimeout(loopBlendTimer)
})

function getAssistantVideo(index: 0 | 1) {
  return index === 0 ? primaryAssistantVideoRef.value : secondaryAssistantVideoRef.value
}

function handleAssistantTimeUpdate(index: 0 | 1) {
  const video = getAssistantVideo(index)
  if (index !== activeAssistantVideo.value || loopBlendTimer || !video?.duration) return

  const remainingSeconds = video.duration - video.currentTime
  if (remainingSeconds <= loopTriggerSeconds) {
    startAssistantLoopBlend(index)
  }
}

function handleAssistantEnded(index: 0 | 1) {
  if (index === activeAssistantVideo.value) {
    startAssistantLoopBlend(index)
  }
}

function startAssistantLoopBlend(currentIndex: 0 | 1) {
  if (loopBlendTimer) return

  const nextIndex = currentIndex === 0 ? 1 : 0
  const currentVideo = getAssistantVideo(currentIndex)
  const nextVideo = getAssistantVideo(nextIndex)
  if (!nextVideo) return

  nextVideo.currentTime = 0
  const playPromise = nextVideo.play()
  activeAssistantVideo.value = nextIndex

  loopBlendTimer = window.setTimeout(() => {
    currentVideo?.pause()
    if (currentVideo) currentVideo.currentTime = 0
    loopBlendTimer = undefined
  }, loopBlendMs)

  playPromise.catch(() => {
    if (loopBlendTimer) window.clearTimeout(loopBlendTimer)
    loopBlendTimer = undefined
    activeAssistantVideo.value = currentIndex
  })
}

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
