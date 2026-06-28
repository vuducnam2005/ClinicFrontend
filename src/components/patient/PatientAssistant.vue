<template>
  <div
    v-if="isVisible"
    class="fixed z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end font-sans"
    :class="isReturningAssistant ? 'assistant-returning' : ''"
    :style="assistantPositionStyle"
  >
    <transition name="chat-fade">
      <div
        v-if="chatOpen"
        class="mb-1 flex h-[min(480px,calc(100vh-13rem))] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl transition-all duration-300 pointer-events-auto"
      >
        <!-- Header -->
        <div class="flex items-center justify-between bg-[#0F52BA] px-4 py-3.5 text-white">
          <div class="flex items-center gap-3">
            <div>
              <h3 class="text-sm font-bold leading-tight">Dogky</h3>
              <p class="text-[10px] font-semibold text-blue-100">Trợ lý hơi cáu · Vẫn đang trực</p>
            </div>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-blue-50 transition hover:bg-white/10"
            aria-label="Đóng Dogky"
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
            placeholder="Hỏi Dogky về dịch vụ..."
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

    <div
      class="group relative flex touch-none select-none flex-col items-center gap-0 rounded-2xl outline-none pointer-events-auto"
      :class="chatOpen || isReturningAssistant ? 'cursor-pointer' : isDraggingAssistant ? 'cursor-grabbing' : 'cursor-grab'"
      role="button"
      tabindex="0"
      aria-label="Mở hoặc đóng Dogky"
      @click="handleAssistantClick"
      @keydown.enter="handleAssistantClick"
      @keydown.space.prevent="handleAssistantClick"
      @pointerdown="startAssistantDrag"
    >
      <span
        v-if="!chatOpen"
        class="assistant-speech-bubble relative z-10 px-5 py-2.5 text-sm font-bold text-[#0F52BA]"
      >
        <span class="relative z-10">Tôi có thể giúp gì cho bạn?</span>
        <span class="assistant-speech-tail"></span>
      </span>
      <span class="relative flex h-28 w-28 items-end justify-center drop-shadow-[0_18px_30px_rgba(15,82,186,0.22)] transition duration-200 group-hover:scale-[1.03] sm:h-32 sm:w-32">
        <video
          :src="assistantVideoUrl"
          class="absolute inset-0 h-full w-full object-contain"
          autoplay
          loop
          muted
          playsinline
          preload="auto"
          aria-hidden="true"
        ></video>

        <!-- Close Button (X) -->
        <button
          type="button"
          class="absolute -top-1 -right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition hover:bg-slate-100 hover:text-slate-800 pointer-events-auto"
          title="Ẩn trợ lý"
          aria-label="Ẩn trợ lý"
          @click.stop="isVisible = false"
          @pointerdown.stop
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Send, X } from 'lucide-vue-next'
import assistantVideoUrl from '@/assets/assistant-loop.webm'

interface Message {
  sender: 'bot' | 'patient'
  text: string
  time: string
}

const inputMsg = ref('')
const isTyping = ref(false)
const chatOpen = ref(false)
const messagesRef = ref<HTMLElement | null>(null)
const defaultAssistantPosition = { bottom: 24, right: 24 }
const assistantReturnMs = 520
const assistantPosition = ref({ ...defaultAssistantPosition })
const isDraggingAssistant = ref(false)
const isReturningAssistant = ref(false)
const isVisible = ref(true)

let dragStartX = 0
let dragStartY = 0
let dragStartBottom = defaultAssistantPosition.bottom
let dragStartRight = defaultAssistantPosition.right
let assistantMovedDuringDrag = false
let ignoreNextAssistantClick = false
let assistantReturnTimer: number | undefined

const assistantPositionStyle = computed(() => ({
  bottom: `${assistantPosition.value.bottom}px`,
  right: `${assistantPosition.value.right}px`,
}))

const messages = ref<Message[]>([
  {
    sender: 'bot',
    text: 'Gâu. Tôi là Dogky đây. Bạn cần gì thì hỏi nhanh nhé, tôi đang trực nhưng không có nghĩa là tôi thích chờ đâu. Yên tâm, tôi vẫn giúp bạn đàng hoàng.',
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

function handleAssistantClick() {
  if (ignoreNextAssistantClick) {
    ignoreNextAssistantClick = false
    return
  }

  if (chatOpen.value) {
    chatOpen.value = false
    return
  }

  openChatFromDefaultPosition()
}

function isAssistantAtDefaultPosition() {
  return (
    Math.abs(assistantPosition.value.bottom - defaultAssistantPosition.bottom) < 1 &&
    Math.abs(assistantPosition.value.right - defaultAssistantPosition.right) < 1
  )
}

function openChatFromDefaultPosition() {
  if (isAssistantAtDefaultPosition()) {
    chatOpen.value = true
    scrollToBottom()
    return
  }

  if (assistantReturnTimer) window.clearTimeout(assistantReturnTimer)
  isReturningAssistant.value = true
  assistantPosition.value = { ...defaultAssistantPosition }

  assistantReturnTimer = window.setTimeout(() => {
    isReturningAssistant.value = false
    assistantReturnTimer = undefined
    chatOpen.value = true
    scrollToBottom()
  }, assistantReturnMs)
}

function clampAssistantPosition() {
  if (typeof window === 'undefined') return

  const padding = 8
  const iconSize = 128
  const maxRight = Math.max(padding, window.innerWidth - iconSize - padding)
  const maxBottom = Math.max(padding, window.innerHeight - iconSize - padding)

  assistantPosition.value = {
    bottom: Math.min(Math.max(assistantPosition.value.bottom, padding), maxBottom),
    right: Math.min(Math.max(assistantPosition.value.right, padding), maxRight),
  }
}

function startAssistantDrag(event: PointerEvent) {
  if (chatOpen.value || isReturningAssistant.value || event.button !== 0) return

  dragStartX = event.clientX
  dragStartY = event.clientY
  dragStartBottom = assistantPosition.value.bottom
  dragStartRight = assistantPosition.value.right
  assistantMovedDuringDrag = false
  isDraggingAssistant.value = true

  window.addEventListener('pointermove', moveAssistant)
  window.addEventListener('pointerup', stopAssistantDrag, { once: true })
  window.addEventListener('pointercancel', stopAssistantDrag, { once: true })
}

function moveAssistant(event: PointerEvent) {
  if (!isDraggingAssistant.value) return

  const deltaX = event.clientX - dragStartX
  const deltaY = event.clientY - dragStartY

  if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
    assistantMovedDuringDrag = true
  }

  assistantPosition.value = {
    bottom: dragStartBottom - deltaY,
    right: dragStartRight - deltaX,
  }
  clampAssistantPosition()
}

function stopAssistantDrag() {
  window.removeEventListener('pointermove', moveAssistant)
  window.removeEventListener('pointerup', stopAssistantDrag)
  window.removeEventListener('pointercancel', stopAssistantDrag)

  isDraggingAssistant.value = false
  if (assistantMovedDuringDrag) {
    ignoreNextAssistantClick = true
    window.setTimeout(() => {
      ignoreNextAssistantClick = false
    }, 0)
  }
}

onMounted(() => {
  clampAssistantPosition()
  window.addEventListener('resize', clampAssistantPosition)
})

onBeforeUnmount(() => {
  if (assistantReturnTimer) window.clearTimeout(assistantReturnTimer)
  window.removeEventListener('resize', clampAssistantPosition)
  window.removeEventListener('pointermove', moveAssistant)
  window.removeEventListener('pointerup', stopAssistantDrag)
  window.removeEventListener('pointercancel', stopAssistantDrag)
})

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
    
    // Tạo tin nhắn của bot với nội dung trống ban đầu
    const botMessage = {
      sender: 'bot' as const,
      text: '',
      time: formatTime(new Date()),
    }
    messages.value.push(botMessage)

    // Chạy chữ từ từ (hiệu ứng streaming/typewriter)
    let index = 0
    const interval = setInterval(() => {
      if (index < reply.length) {
        botMessage.text += reply[index]
        index++
      } else {
        clearInterval(interval)
      }
    }, 20) // 20ms mỗi ký tự
  }, 1000)
}

function getBotReply(inputText: string): string {
  const query = inputText.toLowerCase()
  if (query.includes('đặt lịch') || query.includes('hẹn') || query.includes('khám') || query.includes('booking')) {
    return 'Đặt lịch thì vào mục "Đặt lịch khám" ở menu bên trái. Dễ mà, đừng bắt Dogky phải sủa lần hai nha.'
  }
  if (query.includes('đơn thuốc') || query.includes('thuốc') || query.includes('prescription')) {
    return 'Đơn thuốc nằm ở mục "Đơn thuốc" bên trái. Vào đó là thấy danh sách đã kê, gọn gàng hơn cái bàn làm việc của nhiều người.'
  }
  if (query.includes('hóa đơn') || query.includes('viện phí') || query.includes('tiền') || query.includes('bill') || query.includes('thanh toán')) {
    return 'Hóa đơn và viện phí nằm trong mục "Viện phí". Vào đó xem trạng thái thanh toán, khỏi đoán già đoán non cho mệt.'
  }
  if (query.includes('bệnh án') || query.includes('hồ sơ') || query.includes('record') || query.includes('lịch sử')) {
    return 'Hồ sơ của bạn ở mục "Hồ sơ bệnh án" bên trái. Vào xem chi tiết nhé, Dogky đã chỉ đúng đường rồi đó.'
  }
  if (query.includes('chào') || query.includes('hi') || query.includes('hello')) {
    return 'Chào. Dogky nghe đây. Hỏi gì thì hỏi, tôi cáu nhẹ thôi chứ vẫn lịch sự.'
  }
  return 'Dogky chưa hiểu câu này. Bạn hỏi rõ hơn một chút đi, hoặc chọn Đặt lịch khám, Đơn thuốc, Viện phí, Hồ sơ bệnh án. Tôi cáu vì mơ hồ, không cáu với bạn.'
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

.assistant-returning {
  transition:
    bottom 520ms cubic-bezier(0.34, 1.56, 0.64, 1),
    right 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.assistant-speech-bubble {
  min-width: 13.5rem;
  animation: assistant-speech-cycle 8.5s ease-in-out infinite;
  background:
    radial-gradient(ellipse at 58% 44%, rgba(198, 192, 255, 0.48) 0 46%, transparent 47%),
    #fff;
  border: 3px solid #4a2a1d;
  border-radius: 58% 42% 50% 45% / 56% 54% 44% 48%;
  box-shadow: 0 12px 24px rgba(15, 82, 186, 0.16);
  transform-origin: 50% 118%;
  will-change: opacity, transform;
}

.assistant-speech-tail {
  position: absolute;
  bottom: -0.85rem;
  left: 50%;
  z-index: 0;
  width: 1.35rem;
  height: 1.35rem;
  animation: assistant-speech-tail-cycle 8.5s ease-in-out infinite;
  background: #fff;
  border-bottom: 3px solid #4a2a1d;
  border-right: 3px solid #4a2a1d;
  border-bottom-right-radius: 0.35rem;
  transform-origin: center;
  will-change: opacity, transform;
}

@keyframes assistant-speech-cycle {
  0%,
  38% {
    opacity: 1;
    transform: translateY(0.75rem) scale(1);
  }

  48%,
  70% {
    opacity: 0;
    transform: translate(0.15rem, 4.85rem) scale(0.08);
  }

  78% {
    opacity: 0;
    transform: translate(0.1rem, 4.1rem) scale(0.18);
  }

  88% {
    opacity: 1;
    transform: translateY(0.75rem) scale(1.06);
  }

  94%,
  100% {
    opacity: 1;
    transform: translateY(0.75rem) scale(1);
  }
}

@keyframes assistant-speech-tail-cycle {
  0%,
  38% {
    opacity: 1;
    transform: translateX(-50%) rotate(45deg) scale(1);
  }

  48%,
  70% {
    opacity: 0;
    transform: translate(-50%, 0.8rem) rotate(45deg) scale(0.12);
  }

  78% {
    opacity: 0;
    transform: translate(-50%, 0.55rem) rotate(45deg) scale(0.22);
  }

  88% {
    opacity: 1;
    transform: translateX(-50%) rotate(45deg) scale(1.15);
  }

  94%,
  100% {
    opacity: 1;
    transform: translateX(-50%) rotate(45deg) scale(1);
  }
}

</style>
