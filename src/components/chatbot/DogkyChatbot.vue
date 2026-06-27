<template>
  <div
    class="fixed z-50 flex flex-col items-end"
    :class="isReturningAssistant ? 'assistant-returning' : ''"
    :style="assistantPositionStyle"
  >
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-4 scale-95 opacity-0"
      enter-to-class="translate-y-0 scale-100 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 scale-100 opacity-100"
      leave-to-class="translate-y-4 scale-95 opacity-0"
    >
      <section
        v-if="isOpen"
        class="mb-4 flex h-[500px] max-h-[calc(100vh-8rem)] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        aria-label="DogkyChatbot"
      >
        <header class="flex items-center justify-between bg-teal-700 px-4 py-3 text-white">
          <div class="flex min-w-0 items-center gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
              <Stethoscope class="h-5 w-5" />
            </span>
            <div class="min-w-0">
              <h2 class="truncate text-sm font-bold leading-tight">DogkyChatbot</h2>
              <p class="truncate text-xs font-medium text-teal-100">Cún bác sĩ Medicare đang trực</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-teal-50 transition hover:bg-white/10"
              aria-label="Lịch sử chat"
              @click="showSessionSidebar = !showSessionSidebar"
            >
              <Menu class="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-teal-50 transition hover:bg-white/10"
              aria-label="Tạo chat mới"
              @click="createNewSession()"
            >
              <SquarePen class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-teal-50 transition hover:bg-white/10"
              aria-label="Đóng DogkyChatbot"
              @click="isOpen = false"
            >
              <X class="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        <!-- Session history sidebar -->
        <Transition
          enter-active-class="transition-all duration-250 ease-out"
          enter-from-class="-translate-x-full opacity-0"
          enter-to-class="translate-x-0 opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-x-0 opacity-100"
          leave-to-class="-translate-x-full opacity-0"
        >
          <div
            v-if="showSessionSidebar"
            class="dogky-sidebar absolute inset-0 z-10 flex"
          >
            <div class="flex w-full flex-col bg-slate-800 text-white">
              <div class="flex items-center justify-between border-b border-slate-700 px-4 py-3">
                <span class="text-sm font-bold">Lịch sử chat</span>
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-700 hover:text-white"
                  aria-label="Đóng lịch sử"
                  @click="showSessionSidebar = false"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                class="mx-3 mt-3 flex items-center gap-2 rounded-xl bg-teal-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-teal-500"
                @click="createNewSession()"
              >
                <SquarePen class="h-3.5 w-3.5" />
                Chat mới
              </button>

              <div class="mt-3 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
                <div
                  v-for="session in sortedSessions"
                  :key="session.id"
                  role="button"
                  tabindex="0"
                  class="group flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs transition"
                  :class="session.id === activeSessionId ? 'bg-teal-700/40 text-teal-200' : 'text-slate-300 hover:bg-slate-700 hover:text-white'"
                  @click="switchToSession(session.id)"
                  @keydown.enter="switchToSession(session.id)"
                >
                  <MessageSquareText class="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span class="min-w-0 flex-1 truncate">{{ session.title }}</span>
                  <button
                    type="button"
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                    aria-label="Xóa phiên chat"
                    @click.stop="deleteSession(session.id)"
                  >
                    <Trash2 class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <div ref="conversationRef" class="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
          <div
            v-for="message in messages"
            :key="message.id"
            class="flex"
            :class="message.sender === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div class="max-w-[82%]">
              <div
                class="whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm"
                :class="
                  message.sender === 'user'
                    ? 'rounded-br-md bg-teal-700 text-white'
                    : 'rounded-bl-md border border-slate-100 bg-white text-slate-800'
                "
              >
                <template v-if="message.table">
                  <p class="mb-2 font-semibold text-slate-900">{{ message.text }}</p>
                  <dl class="overflow-hidden rounded-xl border border-slate-200">
                    <div
                      v-for="row in message.table.rows"
                      :key="row.label"
                      class="grid grid-cols-[104px_1fr] border-b border-slate-100 last:border-b-0"
                    >
                      <dt class="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">{{ row.label }}</dt>
                      <dd class="min-w-0 px-3 py-2 text-xs font-semibold text-slate-800">{{ row.value }}</dd>
                    </div>
                  </dl>
                </template>
                <template v-else-if="message.specialtySelector">
                  <p class="mb-3 font-semibold text-slate-900">{{ message.text }}</p>
                  <div class="grid grid-cols-2 gap-2 mt-2">
                    <button
                      v-for="s in message.specialtySelector.specialties"
                      :key="s.specialtyId"
                      type="button"
                      class="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl transition hover:bg-teal-100/70 hover:scale-[1.02] active:scale-[0.98]"
                      @click="selectSpecialty(s.specialtyId, s.specialtyName)"
                    >
                      {{ s.specialtyName }}
                    </button>
                  </div>
                </template>
                <template v-else-if="message.doctorSelector">
                  <p class="mb-3 font-semibold text-slate-900">{{ message.text }}</p>
                  <div class="flex flex-col gap-2 mt-2">
                    <button
                      v-for="d in message.doctorSelector.doctors"
                      :key="d.doctorId"
                      type="button"
                      class="flex flex-col text-left px-3 py-2.5 border border-slate-100 bg-slate-50 hover:bg-teal-50/50 hover:border-teal-200 rounded-xl transition hover:scale-[1.01] active:scale-[0.99] group"
                      @click="selectDoctor(d.doctorId, d.doctorName, d.examFee)"
                    >
                      <span class="font-bold text-slate-800 group-hover:text-teal-700 text-xs">{{ d.doctorName }}</span>
                      <span class="text-[10px] text-slate-500 font-medium mt-0.5">{{ d.specialtyName }} · Phí khám: {{ formatCurrency(d.examFee) }}</span>
                    </button>
                  </div>
                </template>
                <template v-else-if="message.dateSelector">
                  <p class="mb-3 font-semibold text-slate-900">{{ message.text }}</p>
                  <div class="flex flex-col gap-2 mt-2">
                    <button
                      v-for="d in message.dateSelector.dates"
                      :key="d.value"
                      type="button"
                      class="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl transition hover:bg-teal-100/70 hover:scale-[1.02] active:scale-[0.98]"
                      @click="selectDate(d.value, d.label)"
                    >
                      {{ d.label }}
                    </button>
                  </div>
                </template>
                <template v-else-if="message.timeSlotSelector">
                  <p class="mb-3 font-semibold text-slate-900">{{ message.text }}</p>
                  <div v-if="message.timeSlotSelector.loading" class="flex items-center gap-1.5 py-1">
                    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-600"></span>
                    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-600 [animation-delay:150ms]"></span>
                    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-600 [animation-delay:300ms]"></span>
                  </div>
                  <div v-else class="grid grid-cols-3 gap-2 mt-2">
                    <button
                      v-for="slot in message.timeSlotSelector.slots"
                      :key="slot"
                      type="button"
                      class="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition"
                      @click="selectTimeSlot(slot)"
                    >
                      {{ slot }}
                    </button>
                  </div>
                </template>
                <template v-else-if="message.bookingConfirm">
                  <p class="mb-3 font-semibold text-slate-900">{{ message.text }}</p>
                  <!-- Confirmation Ticket -->
                  <div class="border border-dashed border-teal-300 bg-teal-50/20 rounded-2xl p-3.5 my-2 shadow-sm">
                    <div class="text-center pb-2 border-b border-dashed border-teal-200">
                      <span class="text-xs font-bold uppercase tracking-wider text-teal-800">Thông tin lịch hẹn</span>
                    </div>
                    <div class="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] mt-3">
                      <span class="font-bold text-slate-500">Người khám:</span>
                      <span class="font-semibold text-slate-800 text-right">{{ patientDetail?.fullName || 'Bệnh nhân' }}</span>
                      
                      <span class="font-bold text-slate-500">Chuyên khoa:</span>
                      <span class="font-semibold text-slate-800 text-right">{{ message.bookingConfirm.specialtyName }}</span>
                      
                      <span class="font-bold text-slate-500">Bác sĩ:</span>
                      <span class="font-semibold text-slate-800 text-right">{{ message.bookingConfirm.doctorName }}</span>
                      
                      <span class="font-bold text-slate-500">Ngày khám:</span>
                      <span class="font-semibold text-slate-800 text-right">{{ message.bookingConfirm.dateText }}</span>
                      
                      <span class="font-bold text-slate-500">Giờ khám:</span>
                      <span class="font-semibold text-slate-800 text-right">{{ message.bookingConfirm.slotTime }}</span>
                      
                      <span class="font-bold text-slate-500">Phí khám:</span>
                      <span class="font-bold text-slate-900 text-right">{{ formatCurrency(message.bookingConfirm.fee) }}</span>
                    </div>
                    <div class="mt-3.5 pt-2 border-t border-dashed border-teal-200">
                      <input
                        v-model="bookingReason"
                        type="text"
                        placeholder="Nhập lý do khám (nếu có)..."
                        class="w-full text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-teal-300 transition text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 mt-3">
                    <button
                      type="button"
                      class="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition hover:scale-[1.02] active:scale-[0.98]"
                      @click="activeBooking = null; addBotMessage('Gâu! Lịch hẹn của bạn đã hủy bỏ.')"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      class="px-3 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition hover:scale-[1.02] active:scale-[0.98]"
                      @click="confirmBooking(bookingReason)"
                    >
                      Xác nhận
                    </button>
                  </div>
                </template>
                <template v-else-if="message.bookingSuccess">
                  <p class="font-semibold text-slate-900 text-xs">{{ message.text }}</p>
                  <!-- Success Slip -->
                  <div class="flex items-center gap-2 mt-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-800">
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-bold">✓</span>
                    <div class="text-[11px]">
                      <p class="font-bold">Lịch hẹn đã được xác nhận</p>
                      <p class="mt-0.5 text-slate-500 font-mono">Mã đặt chỗ: {{ message.bookingSuccess.appointmentCode || `#${message.bookingSuccess.appointmentId}` }}</p>
                    </div>
                  </div>
                  <div class="mt-3 flex gap-2">
                    <RouterLink
                      to="/patient/appointments"
                      class="inline-flex flex-1 items-center justify-center rounded-xl border border-teal-600 px-3 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-50 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Xem lịch của tôi
                    </RouterLink>
                  </div>
                </template>
                <template v-else>
                  {{ message.text }}
                </template>
              </div>

              <RouterLink
                v-if="loginPromptMessageId === message.id"
                to="/login"
                class="mt-2 inline-flex items-center gap-2 rounded-full border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-50"
              >
                <LogIn class="h-3.5 w-3.5" />
                Đăng nhập
              </RouterLink>

              <div
                v-if="message.id === initialBotMessageId"
                class="mt-3 flex flex-wrap gap-2"
              >
                <button
                  v-for="action in quickActions"
                  :key="action.key"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-full border border-teal-600 px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  :disabled="isLoading"
                  @click="handleQuickAction(action)"
                >
                  <component :is="quickActionIcon(action.key)" class="h-3.5 w-3.5" />
                  {{ action.label }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="isLoading" class="flex justify-start">
            <div class="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <span class="h-2 w-2 animate-bounce rounded-full bg-teal-500"></span>
              <span class="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:150ms]"></span>
              <span class="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:300ms]"></span>
            </div>
          </div>
        </div>

        <form class="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3" @submit.prevent="sendMessage()">
          <input
            v-model="inputValue"
            type="text"
            class="min-w-0 flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            placeholder="Nhập câu hỏi cho Dogky..."
            :disabled="isLoading"
          />
          <button
            type="submit"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-md transition hover:bg-teal-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            :disabled="!canSend"
            aria-label="Gửi tin nhắn"
          >
            <Send class="h-4.5 w-4.5" />
          </button>
        </form>
      </section>
    </Transition>

    <div class="relative flex flex-col items-end">
      <Transition
        enter-active-class="dogky-cloud-enter-active"
        enter-from-class="dogky-cloud-enter-from"
        enter-to-class="dogky-cloud-enter-to"
        leave-active-class="dogky-cloud-leave-active"
        leave-from-class="dogky-cloud-leave-from"
        leave-to-class="dogky-cloud-leave-to"
      >
        <div
          v-if="notificationActive && !isOpen"
          class="dogky-cloud-bubble absolute bottom-[4.2rem] right-[-3.35rem] flex h-[190px] w-[320px] items-center justify-center bg-contain bg-center bg-no-repeat px-[80px] pb-[48px] pt-[60px] text-center text-xs font-bold leading-4 text-slate-800 drop-shadow-[0_18px_24px_rgba(15,23,42,0.16)]"
          :style="{ backgroundImage: `url(${chatBubbleUrl})` }"
        >
          <span class="dogky-cloud-text line-clamp-3">{{ notificationText }}</span>
        </div>
      </Transition>

      <button
        type="button"
        class="animate-float relative flex h-28 w-28 touch-none select-none items-center justify-center overflow-visible rounded-full transition-all duration-300 hover:scale-110"
        :class="isOpen || isReturningAssistant ? 'cursor-pointer' : isDraggingAssistant ? 'cursor-grabbing' : 'cursor-grab'"
        :aria-label="isOpen ? 'Đóng DogkyChatbot' : 'Mở DogkyChatbot'"
        @click="handleAssistantClick"
        @pointerdown="startAssistantDrag"
      >
        <video
          :src="assistantVideoUrl"
          class="h-full w-full object-contain drop-shadow-[0_18px_30px_rgba(15,82,186,0.22)]"
          autoplay
          loop
          muted
          playsinline
          preload="auto"
          aria-hidden="true"
        ></video>
        <span class="absolute right-5 top-5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { Component } from 'vue'
import { FileHeart, LogIn, Menu, MessageSquareText, Pill, ReceiptText, Send, SquarePen, Stethoscope, Trash2, X, CalendarClock } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { appointmentApi } from '@/services/appointmentApi'
import { billingApi } from '@/services/billingApi'
import { medicalRecordApi } from '@/services/medicalRecordApi'
import type { Patient } from '@/types/medicalRecord'
import assistantVideoUrl from '@/assets/assistant-loop.webm'
import chatBubbleUrl from '@/assets/chat.png'

interface ChatMessage {
  id: number
  sender: 'bot' | 'user'
  text: string
  table?: {
    rows: ChatTableRow[]
  }
  specialtySelector?: {
    specialties: Array<{ specialtyId: number; specialtyName: string }>
  }
  doctorSelector?: {
    doctors: Array<{ doctorId: number; doctorName: string; examFee: number; specialtyName: string }>
  }
  dateSelector?: {
    dates: Array<{ label: string; value: string }>
  }
  timeSlotSelector?: {
    slots: string[]
    loading?: boolean
  }
  bookingConfirm?: {
    specialtyName: string
    doctorName: string
    dateText: string
    slotTime: string
    fee: number
  }
  bookingSuccess?: {
    appointmentId: number
    appointmentCode?: string
    fee: number
  }
}

interface ChatTableRow {
  label: string
  value: string
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

interface ChatSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  history: GeminiContent[]
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        thought?: boolean
      }>
    }
  }>
}

type QuickActionKey = 'symptom' | 'prescription' | 'invoice' | 'record' | 'booking'

interface QuickAction {
  key: QuickActionKey
  label: string
}

type LooseRecord = Record<string, any>

const SYSTEM_INSTRUCTION = 'Bạn là chú cún bác sĩ Dogky đáng yêu của Medicare, vô cùng lịch sự, lễ phép, thân thiện và nhiệt tình tư vấn cho khách hàng. Hãy luôn chào hỏi lễ phép, thỉnh thoảng có thể sủa nhẹ "Gâu!" một cách đáng yêu để giữ nét đặc trưng của một chú cún. Hãy trả lời ngắn gọn dưới 3 câu. Nếu người dùng mô tả triệu chứng bệnh, hãy đưa ra lời khuyên sơ bộ và chuyên khoa khám phù hợp, sau đó hỏi lịch sự xem họ có cần bạn đặt lịch khám giúp không. Nếu họ đồng ý (ví dụ nói "có", "ừ", "đặt giúp mình", "ok"...), bạn hãy trả lời đồng ý thân thiện và BẮT BUỘC kèm theo từ khóa đặc biệt [TRIGGER_BOOKING] ở cuối câu trả lời để hệ thống kích hoạt chức năng đặt lịch.'
const MAX_HISTORY_TURNS = 20
const SESSIONS_STORAGE_KEY = 'dogky_chat_sessions'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const initialBotMessageId = 1
let lastMessageId = initialBotMessageId

const isOpen = ref(false)
const isLoading = ref(false)
const messages = ref<ChatMessage[]>([
  {
    id: initialBotMessageId,
    sender: 'bot',
    text: 'Gâu! Dogky đang trực đây. Có chuyện gì cần hỗ trợ thì nói nhanh lên nhé, gâu!',
  },
])
interface BookingState {
  step: 'specialty' | 'doctor' | 'date' | 'time' | 'confirm' | 'completed'
  specialtyId?: number
  specialtyName?: string
  doctorId?: number
  doctorName?: string
  examFee?: number
  appointmentDate?: string
  slotTime?: string
  reason?: string
}

const activeBooking = ref<BookingState | null>(null)
const bookingReason = ref('')

const conversationHistory = ref<GeminiContent[]>([])
const chatSessions = ref<ChatSession[]>([])
const activeSessionId = ref<string | null>(null)
const showSessionSidebar = ref(false)
const inputValue = ref('')
const notificationActive = ref(false)
const notificationText = ref('')
const conversationRef = ref<HTMLElement | null>(null)
const patientDetail = ref<Patient | null>(null)
const loginPromptMessageId = ref<number | null>(null)
const proactiveReminders = ref<string[]>([])
const defaultAssistantPosition = { bottom: 24, right: 24 }
const assistantReturnMs = 520
const assistantPosition = ref({ ...defaultAssistantPosition })
const isDraggingAssistant = ref(false)
const isReturningAssistant = ref(false)

const runtimeState = reactive({
  activeAction: null as QuickActionKey | null,
})

const quickActions = reactive<QuickAction[]>([
  { key: 'booking', label: 'Đặt lịch khám' },
  { key: 'symptom', label: 'Tư vấn triệu chứng' },
  { key: 'prescription', label: 'Xem đơn thuốc gần nhất' },
  { key: 'invoice', label: 'Xem hóa đơn viện phí' },
  { key: 'record', label: 'Xem hồ sơ bệnh án' },
])

const geminiApiKey = computed(() => import.meta.env.VITE_GEMINI_API_KEY?.trim() || '')
const geminiModel = computed(() => import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-3-flash-preview')
const geminiEndpoint = computed(() =>
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel.value)}:generateContent?key=${encodeURIComponent(geminiApiKey.value)}`,
)
const canSend = computed(() => inputValue.value.trim().length > 0 && !isLoading.value)
const assistantPositionStyle = computed(() => ({
  bottom: `${assistantPosition.value.bottom}px`,
  right: `${assistantPosition.value.right}px`,
}))
const sortedSessions = computed(() =>
  [...chatSessions.value].sort((a, b) => b.updatedAt - a.updatedAt),
)
const geminiRequestTimeoutMs = 30000
const proactiveVisibleMs = 3000
const proactiveHiddenMs = 10000

let notificationTimer: number | undefined
let scrollFrame: number | undefined
let proactiveVisibleTimer: number | undefined
let proactiveHiddenTimer: number | undefined
let proactiveReminderIndex = 0
let dragStartX = 0
let dragStartY = 0
let dragStartBottom = defaultAssistantPosition.bottom
let dragStartRight = defaultAssistantPosition.right
let assistantMovedDuringDrag = false
let ignoreNextAssistantClick = false
let assistantReturnTimer: number | undefined

onMounted(() => {
  clampAssistantPosition()
  window.addEventListener('keydown', handleEscape)
  window.addEventListener('resize', clampAssistantPosition)
  loadAllSessions()
  loadPatientDetail()
  refreshProactiveReminders()
  scrollToBottom()
})

onBeforeUnmount(() => {
  if (notificationTimer) window.clearTimeout(notificationTimer)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  stopProactiveReminderLoop()
  if (assistantReturnTimer) window.clearTimeout(assistantReturnTimer)
  window.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', clampAssistantPosition)
  window.removeEventListener('pointermove', moveAssistant)
  window.removeEventListener('pointerup', stopAssistantDrag)
  window.removeEventListener('pointercancel', stopAssistantDrag)
})

watch(
  () => [notificationStore.toast.show, notificationStore.toast.message] as const,
  ([show]) => {
    if (!show) return
    if (isOpen.value) return

    notificationText.value = compactNotification(notificationStore.toast.message || notificationStore.toast.title || 'Bạn vừa nhận được thông báo mới.')
    notificationActive.value = true

    stopProactiveReminderLoop()
    if (notificationTimer) window.clearTimeout(notificationTimer)
    notificationTimer = window.setTimeout(() => {
      notificationActive.value = false
      notificationTimer = undefined
      scheduleNextProactiveReminder(proactiveHiddenMs)
    }, 6000)
  },
)

watch(isOpen, (open) => {
  if (open) {
    notificationActive.value = false
    stopProactiveReminderLoop()
    if (notificationTimer) {
      window.clearTimeout(notificationTimer)
      notificationTimer = undefined
    }
    return
  }

  scheduleNextProactiveReminder(proactiveHiddenMs)
})

watch(
  () => [authStore.isAuthenticated, authStore.user?.patientId] as const,
  () => {
    refreshProactiveReminders()
    loadPatientDetail()
  },
)

watch(
  () => messages.value.length,
  () => scrollToBottom(),
)

watch(isLoading, () => scrollToBottom())

function handleAssistantClick() {
  if (ignoreNextAssistantClick) {
    ignoreNextAssistantClick = false
    return
  }

  if (isOpen.value) {
    isOpen.value = false
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
    isOpen.value = true
    scrollToBottom()
    return
  }

  if (assistantReturnTimer) window.clearTimeout(assistantReturnTimer)
  isReturningAssistant.value = true
  assistantPosition.value = { ...defaultAssistantPosition }

  assistantReturnTimer = window.setTimeout(() => {
    isReturningAssistant.value = false
    assistantReturnTimer = undefined
    isOpen.value = true
    scrollToBottom()
  }, assistantReturnMs)
}

function startAssistantDrag(event: PointerEvent) {
  if (isOpen.value || isReturningAssistant.value || event.button !== 0) return

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

function clampAssistantPosition() {
  if (typeof window === 'undefined') return

  const padding = 8
  const mascotSize = 112
  const maxRight = Math.max(padding, window.innerWidth - mascotSize - padding)
  const maxBottom = Math.max(padding, window.innerHeight - mascotSize - padding)

  assistantPosition.value = {
    bottom: Math.min(Math.max(assistantPosition.value.bottom, padding), maxBottom),
    right: Math.min(Math.max(assistantPosition.value.right, padding), maxRight),
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') isOpen.value = false
}

function nextMessageId() {
  lastMessageId += 1
  return lastMessageId
}

function addBotMessage(text: string) {
  const id = nextMessageId()
  messages.value.push({ id, sender: 'bot', text })
  return id
}

function addBotTableMessage(text: string, rows: ChatTableRow[]) {
  const id = nextMessageId()
  messages.value.push({ id, sender: 'bot', text, table: { rows } })
  return id
}

function addUserMessage(text: string) {
  messages.value.push({ id: nextMessageId(), sender: 'user', text })
}

function scrollToBottom() {
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined
    if (!conversationRef.value) return
    conversationRef.value.scrollTop = conversationRef.value.scrollHeight
  })
}

async function refreshProactiveReminders() {
  stopProactiveReminderLoop()
  proactiveReminders.value = []
  proactiveReminderIndex = 0

  if (!authStore.isAuthenticated) {
    notificationActive.value = false
    return
  }

  await resolvePatientProfileIfNeeded()
  const patientId = authStore.user?.patientId
  if (!patientId) return

  try {
    const [appointments, invoices, prescriptions] = await Promise.all([
      appointmentApi.getAppointmentsByPatient(patientId).catch(() => []),
      billingApi.getInvoices(patientId).catch(() => []),
      billingApi.getPrescriptions(patientId).catch(() => []),
    ])

    proactiveReminders.value = buildProactiveReminders(
      appointments as LooseRecord[],
      invoices as LooseRecord[],
      prescriptions as LooseRecord[],
    )

    if (!proactiveReminders.value.length) {
      notificationActive.value = false
      return
    }

    scheduleNextProactiveReminder(proactiveHiddenMs)
  } catch (error) {
    console.warn('Dogky proactive reminders unavailable', error)
  }
}

function buildProactiveReminders(appointments: LooseRecord[], invoices: LooseRecord[], prescriptions: LooseRecord[]) {
  const reminders: string[] = []
  const nextAppointment = newestUpcomingAppointment(appointments)
  const latestUnpaidInvoice = newestByDate(invoices.filter(isUnpaidInvoice), ['paidAt', 'createdAt'])
  const latestPrescription = newestByDate(prescriptions, [
    'dispensedAt',
    'submittedAt',
    'sentToPharmacyAt',
    'createdAt',
    'examDate',
    'visitDate',
  ])

  if (nextAppointment) {
    const dateText = formatAppointmentDateTime(nextAppointment)
    const doctorText = stringValue(nextAppointment.doctorName, nextAppointment.DoctorName)
    reminders.push(`Lịch khám ${dateText}${doctorText ? ` với ${doctorText}` : ''}.`)
  }

  if (latestUnpaidInvoice) {
    const code = stringValue(latestUnpaidInvoice.invoiceCode, latestUnpaidInvoice.invoiceIdCode, latestUnpaidInvoice.invoiceId, latestUnpaidInvoice.id)
    const amount = numberValue(latestUnpaidInvoice.balanceDue, latestUnpaidInvoice.totalAmount, latestUnpaidInvoice.amount)
    reminders.push(`Hóa đơn${code ? ` ${code}` : ''}${amount ? `: ${formatCurrency(amount)}` : ''}.`)
  }

  if (latestPrescription) {
    const code = stringValue(latestPrescription.prescriptionCode, latestPrescription.prescriptionIdCode, latestPrescription.id, latestPrescription.prescriptionId)
    reminders.push(`Đơn thuốc${code ? ` ${code}` : ''} đã cập nhật.`)
  }

  return reminders
}

function scheduleNextProactiveReminder(delayMs: number) {
  stopProactiveReminderLoop()
  if (!proactiveReminders.value.length || notificationStore.toast.show || isOpen.value) return

  proactiveHiddenTimer = window.setTimeout(() => {
    showProactiveReminder()
  }, delayMs)
}

function showProactiveReminder() {
  if (!proactiveReminders.value.length || notificationStore.toast.show || isOpen.value) return

  notificationText.value = compactNotification(proactiveReminders.value[proactiveReminderIndex % proactiveReminders.value.length])
  notificationActive.value = true
  proactiveReminderIndex += 1

  proactiveVisibleTimer = window.setTimeout(() => {
    notificationActive.value = false
    proactiveVisibleTimer = undefined
    scheduleNextProactiveReminder(proactiveHiddenMs)
  }, proactiveVisibleMs)
}

function stopProactiveReminderLoop() {
  if (proactiveVisibleTimer) window.clearTimeout(proactiveVisibleTimer)
  if (proactiveHiddenTimer) window.clearTimeout(proactiveHiddenTimer)
  proactiveVisibleTimer = undefined
  proactiveHiddenTimer = undefined
}

function parseDateFromText(text: string): { dateStr: string; label: string } | null {
  const cleanText = text.toLowerCase().replace(/\s+/g, '');
  
  // Regex 1: dd/mm or d/m
  const regexSlash = /(\d{1,2})\/(\d{1,2})/;
  let match = cleanText.match(regexSlash);
  
  // Regex 2: dd-mm or d-m
  if (!match) {
    const regexDash = /(\d{1,2})-(\d{1,2})/;
    match = cleanText.match(regexDash);
  }
  
  // Regex 3: ngày d tháng m
  if (!match) {
    const regexText = /ngày(\d{1,2})tháng(\d{1,2})/;
    match = cleanText.match(regexText);
  }

  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const today = new Date();
      let year = today.getFullYear();
      
      // If the selected month is before today's month, it's probably for next year
      if (month < today.getMonth() + 1) {
        year += 1;
      }
      
      // Validate the date
      const targetDate = new Date(year, month - 1, day);
      if (targetDate.getMonth() === month - 1 && targetDate.getDate() === day) {
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        
        return {
          dateStr: `${yyyy}-${mm}-${dd}`,
          label: `${dd}/${mm}`
        };
      }
    }
  }
  return null;
}

function parseTimeFromText(text: string, availableSlots: string[]): string | null {
  const cleanText = text.toLowerCase().replace(/\s+/g, '').replace('h', ':');
  
  const regexTime = /(\d{1,2}):(\d{2})/;
  let match = cleanText.match(regexTime);
  
  let targetHour = -1;
  let targetMinute = 0;
  
  if (match) {
    targetHour = parseInt(match[1], 10);
    targetMinute = parseInt(match[2], 10);
  } else {
    const regexHourOnly = /(\d{1,2})(?:giờ|h)/;
    const matchHour = cleanText.match(regexHourOnly);
    if (matchHour) {
      targetHour = parseInt(matchHour[1], 10);
      targetMinute = 0;
    }
  }
  
  if (targetHour !== -1) {
    const formattedHour = String(targetHour).padStart(2, '0');
    const formattedMinute = String(targetMinute).padStart(2, '0');
    const targetTimePrefix = `${formattedHour}:${formattedMinute}`;
    
    const matchedSlot = availableSlots.find(slot => slot.startsWith(targetTimePrefix));
    if (matchedSlot) {
      return matchedSlot;
    }
  }
  return null;
}

async function sendMessage(forcedText?: string) {
  const text = (forcedText ?? inputValue.value).trim()
  if (!text || isLoading.value) return

  loginPromptMessageId.value = null
  addUserMessage(text)
  inputValue.value = ''

  const lowercaseText = text.toLowerCase()

  // Tự động hủy tiến trình đặt lịch nếu người dùng muốn đổi chủ đề hoặc muốn hủy
  if (
    lowercaseText.includes('tư vấn') ||
    lowercaseText.includes('đơn thuốc') ||
    lowercaseText.includes('hóa đơn') ||
    lowercaseText.includes('bệnh án') ||
    lowercaseText.includes('đặt lịch') ||
    lowercaseText.includes('đăng ký khám') ||
    lowercaseText.includes('hủy') ||
    lowercaseText.includes('thoát') ||
    lowercaseText.includes('dừng')
  ) {
    activeBooking.value = null
  }

  // Intercept booking wizard steps if active
  if (activeBooking.value) {
    if (activeBooking.value.step === 'date') {
      const parsedDate = parseDateFromText(text)
      if (parsedDate) {
        await selectDate(parsedDate.dateStr, parsedDate.label, true)
        return
      } else {
        addBotMessage('Gâu! Tôi chưa nhận diện được ngày bạn nhập. Bạn vui lòng nhập ngày theo định dạng như "6/7" hoặc "ngày 6 tháng 7" nhé.')
        return
      }
    }
    
    if (activeBooking.value.step === 'time') {
      const lastBotMsg = [...messages.value].reverse().find(m => m.sender === 'bot' && m.timeSlotSelector)
      const availableSlots = lastBotMsg?.timeSlotSelector?.slots || []
      
      const parsedTime = parseTimeFromText(text, availableSlots)
      if (parsedTime) {
        selectTimeSlot(parsedTime, true)
        return
      } else {
        addBotMessage('Gâu! Tôi không tìm thấy khung giờ đó. Bạn vui lòng nhập giờ cụ thể (ví dụ: "8h30", "14:00") hoặc click chọn khung giờ trong danh sách nhé.')
        return
      }
    }
  }

  // Intercept profile query
  const lowercaseText = text.toLowerCase()
  if (
    lowercaseText.includes('thông tin cá nhân') ||
    lowercaseText.includes('thông tin của tôi') ||
    lowercaseText.includes('hồ sơ của tôi') ||
    lowercaseText.includes('tôi là ai') ||
    lowercaseText.includes('thông tin bệnh nhân')
  ) {
    await replyWithPatientProfile()
    return
  }

  // Intercept booking query
  if (
    lowercaseText.includes('đặt lịch') ||
    lowercaseText.includes('đăng ký khám') ||
    lowercaseText.includes('khám bệnh') ||
    lowercaseText.includes('hẹn lịch') ||
    lowercaseText.includes('book lịch')
  ) {
    if (!ensureAuthenticated()) return
    await startBookingWizard()
    return
  }

  isLoading.value = true
  runtimeState.activeAction = 'symptom'

  try {
    let reply = await askGemini(text)
    if (reply.includes('[TRIGGER_BOOKING]')) {
      reply = reply.replace('[TRIGGER_BOOKING]', '').trim()
      addBotMessage(reply)
      setTimeout(() => {
        startBookingWizard()
      }, 1000)
    } else {
      addBotMessage(reply)
    }
  } catch (error) {
    // Rollback: remove the user entry we just pushed into history so
    // a failed request does not pollute the conversation context.
    if (
      conversationHistory.value.length > 0 &&
      conversationHistory.value[conversationHistory.value.length - 1].role === 'user'
    ) {
      conversationHistory.value.pop()
      saveConversationHistory()
    }
    console.error('Dogky Gemini error', error)
    addBotMessage(dogkyGeminiErrorMessage(error))
  } finally {
    isLoading.value = false
    runtimeState.activeAction = null
  }
}

async function askGemini(userText: string) {
  if (!geminiApiKey.value) {
    throw new Error('Missing VITE_GEMINI_API_KEY')
  }

  // Add the new user message to conversation history
  conversationHistory.value.push({ role: 'user', parts: [{ text: userText }] })
  trimConversationHistory()
  saveConversationHistory()

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), geminiRequestTimeoutMs)
  let response: Response

  try {
    response = await fetch(geminiEndpoint.value, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${buildPatientContextString(patientDetail.value)}` }],
        },
        contents: conversationHistory.value,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.6,
        },
      }),
    })
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw new Error('Gemini request timed out')
    throw error
  } finally {
    window.clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(geminiStatusMessage(response.status, errorText))
  }

  const responseData = (await response.json()) as GeminiResponse
  const parts = responseData.candidates?.[0]?.content?.parts || []
  const text = parts
    .filter((part) => !part.thought && part.text)
    .map((part) => part.text)
    .join('')
  const replyText = stripMarkdown(text || 'Gâu! Dogky chưa nghĩ ra câu trả lời rõ ràng. Bạn mô tả lại ngắn gọn hơn nhé.')

  // Save model reply into conversation history
  conversationHistory.value.push({ role: 'model', parts: [{ text: replyText }] })
  saveConversationHistory()

  return replyText
}

function geminiStatusMessage(status: number, body: string) {
  if (status === 400) return 'Gemini request invalid'
  if (status === 401 || status === 403) return 'Gemini API key unauthorized'
  if (status === 404) return `Gemini model not found: ${geminiModel.value}`
  if (status === 429) return 'Gemini quota exceeded'
  const compactBody = body.replace(/\s+/g, ' ').slice(0, 160)
  return `Gemini request failed with status ${status}${compactBody ? `: ${compactBody}` : ''}`
}

function dogkyGeminiErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  if (message.includes('timed out')) return 'Gâu... Gemini phản hồi chậm quá. Bạn thử lại sau vài giây nhé.'
  if (message.includes('Missing VITE_GEMINI_API_KEY')) return 'Gâu! Chưa cấu hình API key Gemini trong .env.'
  if (message.includes('API key unauthorized')) return 'Gâu! API key Gemini chưa đúng hoặc chưa có quyền dùng API.'
  if (message.includes('quota')) return 'Gâu! Gemini đang hết quota hoặc bị giới hạn lượt gọi.'
  if (message.includes('model not found')) return 'Gâu! Model Gemini đang cấu hình chưa đúng. Kiểm tra VITE_GEMINI_MODEL nhé.'
  return 'Gâu... Dogky chưa gọi được Gemini. Bạn thử lại sau một chút nhé.'
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function trimConversationHistory() {
  const maxEntries = MAX_HISTORY_TURNS * 2
  if (conversationHistory.value.length > maxEntries) {
    conversationHistory.value = conversationHistory.value.slice(-maxEntries)
  }
}

function sessionsStorageKey() {
  const userId = authStore.user?.id || authStore.user?.patientId || 'anonymous'
  return `${SESSIONS_STORAGE_KEY}_${userId}`
}

function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function defaultWelcomeMessages(): ChatMessage[] {
  return [
    {
      id: initialBotMessageId,
      sender: 'bot',
      text: 'Gâu! Dogky đang trực đây. Có chuyện gì cần hỗ trợ thì nói nhanh lên nhé, gâu!',
    },
  ]
}

function deriveSessionTitle(sessionMessages: ChatMessage[]) {
  const firstUserMsg = sessionMessages.find((m) => m.sender === 'user')
  if (!firstUserMsg) return 'Cuộc trò chuyện mới'
  const text = firstUserMsg.text.replace(/\s+/g, ' ').trim()
  return text.length > 30 ? `${text.slice(0, 28).trimEnd()}...` : text
}

function syncCurrentSessionState() {
  if (!activeSessionId.value) return
  const session = chatSessions.value.find((s) => s.id === activeSessionId.value)
  if (!session) return
  session.messages = [...messages.value]
  session.history = [...conversationHistory.value]
  session.title = deriveSessionTitle(session.messages)
  session.updatedAt = Date.now()
}

function saveAllSessions() {
  syncCurrentSessionState()
  try {
    // NOTE: sessions contain only user questions and AI responses about
    // medical symptoms — no auth tokens or PII beyond what the user
    // voluntarily typed.  Acceptable for localStorage.
    const serialized = JSON.stringify(chatSessions.value)
    localStorage.setItem(sessionsStorageKey(), serialized)
  } catch {
    // Storage full or unavailable — silently degrade.
  }
}

function saveConversationHistory() {
  saveAllSessions()
}

function loadAllSessions() {
  try {
    const raw = localStorage.getItem(sessionsStorageKey())
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (s): s is ChatSession =>
            typeof s === 'object' &&
            s !== null &&
            typeof s.id === 'string' &&
            typeof s.title === 'string' &&
            Array.isArray(s.messages) &&
            Array.isArray(s.history),
        )
        chatSessions.value = valid
      }
    }
  } catch {
    chatSessions.value = []
  }

  // If sessions exist, load the most recent one
  if (chatSessions.value.length > 0) {
    const sorted = [...chatSessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
    const latest = sorted[0]
    activeSessionId.value = latest.id
    messages.value = latest.messages.length > 0 ? [...latest.messages] : defaultWelcomeMessages()
    conversationHistory.value = [...latest.history]
    lastMessageId = Math.max(initialBotMessageId, ...messages.value.map((m) => m.id))
    trimConversationHistory()
  } else {
    // No sessions — create the first default session
    createNewSession()
  }
}

function createNewSession() {
  // Save current session first
  syncCurrentSessionState()

  const now = Date.now()
  const newSession: ChatSession = {
    id: generateSessionId(),
    title: 'Cuộc trò chuyện mới',
    createdAt: now,
    updatedAt: now,
    messages: defaultWelcomeMessages(),
    history: [],
  }

  chatSessions.value.push(newSession)
  activeSessionId.value = newSession.id
  messages.value = [...newSession.messages]
  conversationHistory.value = []
  lastMessageId = initialBotMessageId
  loginPromptMessageId.value = null
  showSessionSidebar.value = false
  saveAllSessions()
  scrollToBottom()
}

function switchToSession(sessionId: string) {
  if (sessionId === activeSessionId.value) {
    showSessionSidebar.value = false
    return
  }

  // Save current session first
  syncCurrentSessionState()

  const session = chatSessions.value.find((s) => s.id === sessionId)
  if (!session) return

  activeSessionId.value = session.id
  messages.value = session.messages.length > 0 ? [...session.messages] : defaultWelcomeMessages()
  conversationHistory.value = [...session.history]
  lastMessageId = Math.max(initialBotMessageId, ...messages.value.map((m) => m.id))
  loginPromptMessageId.value = null
  showSessionSidebar.value = false
  saveAllSessions()
  scrollToBottom()
}

function deleteSession(sessionId: string) {
  chatSessions.value = chatSessions.value.filter((s) => s.id !== sessionId)

  if (sessionId === activeSessionId.value) {
    // Deleted the active session — switch to another or create new
    if (chatSessions.value.length > 0) {
      const sorted = [...chatSessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
      switchToSession(sorted[0].id)
    } else {
      createNewSession()
    }
  }

  saveAllSessions()
}

async function handleQuickAction(action: QuickAction) {
  if (isLoading.value) return

  if (action.key === 'symptom') {
    await sendMessage(action.label)
    return
  }

  if (action.key === 'booking') {
    if (!ensureAuthenticated()) return
    await startBookingWizard()
    return
  }

  loginPromptMessageId.value = null
  addUserMessage(action.label)

  if (!ensureAuthenticated()) return

  isLoading.value = true
  runtimeState.activeAction = action.key

  try {
    if (action.key === 'prescription') await replyWithLatestPrescription()
    if (action.key === 'invoice') await replyWithLatestInvoice()
    if (action.key === 'record') await replyWithLatestMedicalRecord()
  } catch (error) {
    console.error('Dogky lookup error', error)
    addBotMessage('Gâu! Dogky chưa lấy được dữ liệu của bạn lúc này. Thử lại sau nhé.')
  } finally {
    isLoading.value = false
    runtimeState.activeAction = null
  }
}

function ensureAuthenticated() {
  if (authStore.isAuthenticated) return true

  const id = addBotMessage('Bạn chưa đăng nhập kìa gâu! Hãy đăng nhập trước đi.')
  loginPromptMessageId.value = id
  return false
}

async function replyWithLatestPrescription() {
  const history = await medicalRecordApi.getCurrentPatientHistory()
  const latest = newestByDate(history.prescriptions as LooseRecord[], [
    'submittedAt',
    'sentToPharmacyAt',
    'dispensedAt',
    'createdAt',
    'examDate',
    'visitDate',
  ])

  if (!latest) {
    addBotMessage('Gâu, Dogky chưa thấy đơn thuốc nào trong hồ sơ của bạn.')
    return
  }

  const items = prescriptionItems(latest)
  const code = stringValue(latest.prescriptionCode, latest.prescriptionIdCode, latest.id, latest.prescriptionId)
  const medicineSummary = items.length
    ? items.slice(0, 4).map((item, index) => {
        const name = stringValue(item.medicineName, item.medicineNameSnapshot, item.name, item.Name) || 'Thuốc chưa rõ tên'
        const dosage = stringValue(item.dosage, item.Dosage) || 'chưa có liều'
        const frequency = stringValue(item.frequency, item.Frequency)
        return `${index + 1}. ${name} - ${dosage}${frequency ? `, ${frequency}` : ''}`
      }).join('\n')
    : 'Chưa có chi tiết thuốc'

  addBotTableMessage(code ? `Gâu, đơn thuốc gần nhất (${code}) đây:` : 'Gâu, đơn thuốc gần nhất đây:', [
    { label: 'Mã đơn', value: code || 'Không rõ' },
    { label: 'Ngày kê', value: formatDate(stringValue(latest.submittedAt, latest.createdAt, latest.examDate, latest.visitDate)) || 'Không rõ' },
    { label: 'Trạng thái', value: stringValue(latest.status, latest.stockStatus) || 'Không rõ' },
    { label: 'Thuốc', value: medicineSummary },
  ])
}

async function replyWithLatestInvoice() {
  await resolvePatientProfileIfNeeded()
  const patientId = authStore.user?.patientId

  if (!patientId) {
    addBotMessage('Gâu, tài khoản này chưa gắn mã bệnh nhân nên Dogky chưa tra được viện phí.')
    return
  }

  const invoices = (await billingApi.getInvoices(patientId)) as LooseRecord[]
  const latest = newestByDate(invoices, ['paidAt', 'createdAt'])

  if (!latest) {
    addBotMessage('Gâu, Dogky chưa thấy hóa đơn viện phí nào của bạn.')
    return
  }

  const code = stringValue(latest.invoiceCode, latest.invoiceIdCode, latest.invoiceId, latest.id)
  const examFee = numberValue(latest.examinationFee, latest.examFee, latest.amount)
  const medicineTotal = numberValue(latest.medicineTotal)
  const status = stringValue(latest.status, latest.invoiceStatus) || 'Chưa rõ'

  addBotTableMessage(code ? `Gâu, hóa đơn mới nhất (${code}):` : 'Gâu, hóa đơn mới nhất:', [
    { label: 'Mã hóa đơn', value: code || 'Không rõ' },
    { label: 'Tiền khám', value: formatCurrency(examFee) },
    { label: 'Tiền thuốc', value: formatCurrency(medicineTotal) },
    { label: 'Trạng thái', value: translateInvoiceStatus(status) },
  ])
}

async function replyWithLatestMedicalRecord() {
  const history = await medicalRecordApi.getCurrentPatientClinicalTimeline()
  const latest = newestByDate(history.medicalRecords as LooseRecord[], [
    'completedAt',
    'examDate',
    'createdAt',
    'updatedAt',
  ])

  if (!latest) {
    addBotMessage('Gâu, Dogky chưa thấy bệnh án khám gần đây nào của bạn.')
    return
  }

  const diagnosis = stringValue(latest.diagnosisText, latest.diagnosis, latest.diagnosisCode) || 'Chưa có chẩn đoán'
  const doctorNote = stringValue(latest.doctorNote, latest.doctorNotes, latest.treatmentPlan) || 'Chưa có lời dặn của bác sĩ'
  const date = formatDate(stringValue(latest.completedAt, latest.examDate, latest.createdAt, latest.updatedAt))

  const docName = stringValue(latest.doctorName)
    || (latest.doctorId ? await getDoctorName(latest.doctorId) : '')
    || 'Không rõ'

  addBotTableMessage(date ? `Gâu, bệnh án gần nhất ngày ${date}:` : 'Gâu, bệnh án gần nhất:', [
    { label: 'Ngày khám', value: date || 'Không rõ' },
    { label: 'Chẩn đoán', value: diagnosis },
    { label: 'Bác sĩ', value: docName },
    { label: 'Lời dặn', value: doctorNote },
  ])
}

const doctorNamesMap: Record<number, string> = {
  1: 'BS. Nguyễn Văn An',
  2: 'BS. Trần Thị Bình',
  3: 'BS. Lê Vân Châu',
  4: 'BS. Phạm Quốc Dũng',
  5: 'BS. Hoàng Thu Hà',
  6: 'BS. Đỗ Minh Khang',
  7: 'BS. Võ Lan Anh',
  8: 'BS. Nguyễn Đức Huy',
  9: 'BS. Bùi Thanh Tâm',
  10: 'BS. Trịnh Quang Minh'
}

async function getDoctorName(doctorId?: number | string) {
  if (!doctorId) return ''
  const docId = Number(doctorId)

  // Try fetching patient's appointments to see if we can match
  try {
    const patientId = Number(authStore.user?.patientId)
    if (patientId) {
      const appointments = await appointmentApi.getAppointmentsByPatient(patientId)
      const appt = appointments.find(a => Number(a.doctorId) === docId)
      if (appt?.doctorName) return appt.doctorName
    }
  } catch (e) {
    console.warn('Failed to resolve doctor name from appointments', e)
  }

  // Try fetching doctor profile directly from appointment service
  try {
    const doctors = await appointmentApi.getDoctors()
    const doc = doctors.find(d => Number(d.doctorId) === docId)
    if (doc?.doctorName || doc?.fullName) return doc.doctorName || doc.fullName
  } catch (e) {
    console.warn('Failed to resolve doctor name from doctors list', e)
  }

  return doctorNamesMap[docId] || `Bác sĩ #${docId}`
}

async function loadPatientDetail() {
  if (!authStore.isAuthenticated) {
    patientDetail.value = null
    return
  }
  try {
    patientDetail.value = await medicalRecordApi.getCurrentPatient()
  } catch (e) {
    console.warn('Failed to load patient detail in chatbot', e)
  }
}

function buildPatientContextString(patient: Patient | null) {
  if (!patient) return 'Chưa có thông tin bệnh nhân đăng nhập.'
  return `
Bệnh nhân đang đăng nhập:
- Họ tên: ${patient.fullName || 'Chưa rõ'}
- Ngày sinh: ${patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Chưa rõ'}
- Giới tính: ${patient.gender === 'Male' ? 'Nam' : patient.gender === 'Female' ? 'Nữ' : 'Chưa rõ'}
- Số điện thoại: ${patient.phoneNumber || patient.phone || 'Chưa rõ'}
- Email: ${patient.email || 'Chưa rõ'}
- Địa chỉ: ${patient.address || 'Chưa rõ'}
- Nhóm máu: ${patient.bloodType || 'Chưa rõ'}
- CCCD/CMND: ${patient.citizenId || 'Chưa rõ'}
- Tiền sử dị ứng: ${patient.allergyNote || patient.allergies || 'Chưa ghi nhận'}
- Tiền sử bệnh lý: ${patient.medicalHistory || 'Chưa ghi nhận'}
`.trim()
}

async function replyWithPatientProfile() {
  isLoading.value = true
  try {
    if (!patientDetail.value) {
      await loadPatientDetail()
    }
    const patient = patientDetail.value
    if (!patient) {
      addBotMessage('Gâu! Dogky chưa tìm thấy thông tin bệnh nhân của bạn trong hệ thống.')
      return
    }

    const name = patient.fullName || 'Chưa rõ'
    const dob = patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Chưa rõ'
    const gender = patient.gender === 'Male' ? 'Nam' : patient.gender === 'Female' ? 'Nữ' : 'Chưa rõ'
    const phone = patient.phoneNumber || patient.phone || 'Chưa rõ'
    const email = patient.email || 'Chưa rõ'
    const address = patient.address || 'Chưa rõ'
    const bloodType = patient.bloodType || 'Chưa rõ'
    const citizenId = patient.citizenId || 'Chưa rõ'
    const allergies = patient.allergyNote || patient.allergies || 'Chưa ghi nhận'
    const history = patient.medicalHistory || 'Chưa ghi nhận'

    addBotTableMessage('Gâu! Đây là thông tin cá nhân của bạn trên hệ thống Medicare:', [
      { label: 'Họ và tên', value: name },
      { label: 'Ngày sinh', value: dob },
      { label: 'Giới tính', value: gender },
      { label: 'Số điện thoại', value: phone },
      { label: 'Email', value: email },
      { label: 'Địa chỉ', value: address },
      { label: 'Nhóm máu', value: bloodType },
      { label: 'CCCD/CMND', value: citizenId },
      { label: 'Tiền sử dị ứng', value: allergies },
      { label: 'Tiền sử bệnh lý', value: history },
    ])
  } catch (error) {
    console.error('Failed to load profile details in chatbot', error)
    addBotMessage('Gâu! Có lỗi xảy ra khi lấy thông tin cá nhân của bạn.')
  } finally {
    isLoading.value = false
  }
}

async function startBookingWizard() {
  activeBooking.value = { step: 'specialty' }
  isLoading.value = true
  try {
    const specialties = await appointmentApi.getSpecialties()
    
    // Add bot message with interactive specialtySelector
    const msgId = nextMessageId()
    const msg: ChatMessage = {
      id: msgId,
      sender: 'bot',
      text: 'Gâu! Medicare có các chuyên khoa sau. Bạn hãy chọn chuyên khoa muốn đăng ký khám nhé:',
      specialtySelector: {
        specialties: specialties.map(s => ({
          specialtyId: Number(s.specialtyId),
          specialtyName: s.specialtyName || ''
        }))
      }
    }
    messages.value.push(msg)
    saveAllSessions()
  } catch (error) {
    console.error('Failed to start booking wizard', error)
    addBotMessage('Gâu! Không thể tải danh sách chuyên khoa lúc này.')
  } finally {
    isLoading.value = false
  }
}

async function selectSpecialty(specialtyId: number, specialtyName: string) {
  if (!activeBooking.value) return
  addUserMessage(`Tôi chọn chuyên khoa: ${specialtyName}`)
  
  activeBooking.value.specialtyId = specialtyId
  activeBooking.value.specialtyName = specialtyName
  activeBooking.value.step = 'doctor'
  
  isLoading.value = true
  try {
    const doctors = await appointmentApi.getDoctorsBySpecialty(specialtyId)
    if (!doctors.length) {
      addBotMessage(`Gâu! Hiện chưa có bác sĩ nào trực thuộc chuyên khoa ${specialtyName}.`)
      activeBooking.value = null
      return
    }
    
    const msgId = nextMessageId()
    const msg: ChatMessage = {
      id: msgId,
      sender: 'bot',
      text: `Gâu! Tiếp theo, hãy chọn bác sĩ khám của khoa ${specialtyName}:`,
      doctorSelector: {
        doctors: doctors.map(d => ({
          doctorId: Number(d.doctorId),
          doctorName: d.doctorName || d.fullName || 'Bác sĩ',
          examFee: Number(d.examFee || 150000),
          specialtyName: d.specialtyName || specialtyName
        }))
      }
    }
    messages.value.push(msg)
    saveAllSessions()
  } catch (error) {
    console.error('Failed to select specialty', error)
    addBotMessage('Gâu! Có lỗi xảy ra khi tải danh sách bác sĩ.')
    activeBooking.value = null
  } finally {
    isLoading.value = false
  }
}

function selectDoctor(doctorId: number, doctorName: string, examFee: number) {
  if (!activeBooking.value) return
  addUserMessage(`Tôi chọn bác sĩ: ${doctorName}`)
  
  activeBooking.value.doctorId = doctorId
  activeBooking.value.doctorName = doctorName
  activeBooking.value.examFee = examFee
  activeBooking.value.step = 'date'
  
  // Create 3 date candidates: Today, Tomorrow, Day after tomorrow
  const dates = []
  const today = new Date()
  
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(today.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    
    let label = ''
    if (i === 0) label = `Hôm nay (${dd}/${mm})`
    else if (i === 1) label = `Ngày mai (${dd}/${mm})`
    else {
      const dayName = dayNames[d.getDay()]
      label = `${dayName} (${dd}/${mm})`
    }
    
    dates.push({ label, value: dateStr })
  }
  
  const msgId = nextMessageId()
  const msg: ChatMessage = {
    id: msgId,
    sender: 'bot',
    text: `Gâu! Hãy chọn ngày bạn muốn đến khám với ${doctorName}:`,
    dateSelector: { dates }
  }
  messages.value.push(msg)
  saveAllSessions()
}

async function selectDate(dateValue: string, dateLabel: string, skipAddUserMessage?: boolean) {
  if (!activeBooking.value) return
  if (!skipAddUserMessage) {
    addUserMessage(`Tôi chọn ngày: ${dateLabel}`)
  }
  
  activeBooking.value.appointmentDate = dateValue
  activeBooking.value.step = 'time'
  
  const doctorId = activeBooking.value.doctorId!
  const doctorName = activeBooking.value.doctorName!
  
  isLoading.value = true
  
  // Pre-insert a message with loading state
  const msgId = nextMessageId()
  const msg: ChatMessage = {
    id: msgId,
    sender: 'bot',
    text: `Gâu! Đang tìm các khung giờ trống của ${doctorName} trong ngày ${dateLabel}...`,
    timeSlotSelector: {
      slots: [],
      loading: true
    }
  }
  messages.value.push(msg)
  saveAllSessions()
  
  try {
    const slots = await appointmentApi.getAvailableSlots(doctorId, dateValue)
    
    // Update the message slots
    const foundMsg = messages.value.find(m => m.id === msgId)
    if (foundMsg && foundMsg.timeSlotSelector) {
      foundMsg.timeSlotSelector.loading = false
      if (slots.length > 0) {
        foundMsg.text = `Gâu! Hãy chọn một khung giờ khám còn trống cho ngày ${dateLabel}:`
        foundMsg.timeSlotSelector.slots = slots
      } else {
        foundMsg.text = `Gâu! Rất tiếc, ngày ${dateLabel} đã hết sạch giờ khám trống cho bác sĩ ${doctorName}. Bạn hãy quay lại đặt ngày khác hoặc chọn bác sĩ khác nhé.`
        activeBooking.value = null
      }
      saveAllSessions()
    }
  } catch (error) {
    console.error('Failed to load slots', error)
    const foundMsg = messages.value.find(m => m.id === msgId)
    if (foundMsg) {
      foundMsg.text = 'Gâu! Có lỗi xảy ra khi tìm giờ khám trống.'
      if (foundMsg.timeSlotSelector) foundMsg.timeSlotSelector.loading = false
    }
    activeBooking.value = null
  } finally {
    isLoading.value = false
  }
}

function selectTimeSlot(timeValue: string, skipAddUserMessage?: boolean) {
  if (!activeBooking.value) return
  if (!skipAddUserMessage) {
    addUserMessage(`Tôi chọn giờ khám: ${timeValue}`)
  }
  
  activeBooking.value.slotTime = timeValue
  activeBooking.value.step = 'confirm'
  
  const dateText = formatDate(activeBooking.value.appointmentDate!)
  
  const msgId = nextMessageId()
  const msg: ChatMessage = {
    id: msgId,
    sender: 'bot',
    text: 'Gâu! Dogky đã chuẩn bị xong phiếu đặt lịch. Bạn vui lòng kiểm tra lại thông tin và bấm Xác nhận đặt lịch nhé:',
    bookingConfirm: {
      specialtyName: activeBooking.value.specialtyName!,
      doctorName: activeBooking.value.doctorName!,
      dateText: dateText || activeBooking.value.appointmentDate!,
      slotTime: timeValue,
      fee: activeBooking.value.examFee!
    }
  }
  messages.value.push(msg)
  saveAllSessions()
}

async function confirmBooking(reason: string) {
  if (!activeBooking.value) return
  isLoading.value = true
  
  try {
    // Resolve patient details if needed
    if (!patientDetail.value) {
      await loadPatientDetail()
    }
    
    const patient = patientDetail.value
    if (!patient) {
      addBotMessage('Gâu! Không thể xác định tài khoản bệnh nhân để đặt lịch.')
      activeBooking.value = null
      return
    }
    
    const payload = {
      patientId: Number(patient.id || patient.patientId),
      patientNameSnapshot: patient.fullName,
      patientPhoneSnapshot: patient.phoneNumber || patient.phone || '0000000000',
      doctorId: activeBooking.value.doctorId!,
      appointmentDate: activeBooking.value.appointmentDate!,
      slotTime: activeBooking.value.slotTime!,
      reason: reason.trim() || 'Khám sức khỏe'
    }
    
    const appointment = await appointmentApi.createAppointment(payload)
    
    // Clear wizard state
    const fee = activeBooking.value.examFee!
    activeBooking.value = null
    
    const msgId = nextMessageId()
    const msg: ChatMessage = {
      id: msgId,
      sender: 'bot',
      text: `Gâu! Chúc mừng bạn đã đặt lịch khám thành công!`,
      bookingSuccess: {
        appointmentId: appointment.appointmentId,
        appointmentCode: appointment.appointmentCode,
        fee
      }
    }
    messages.value.push(msg)
    saveAllSessions()
  } catch (error) {
    console.error('Failed to create appointment via chatbot', error)
    addBotMessage('Gâu! Gặp lỗi hệ thống khi đăng ký đặt lịch. Vui lòng thử đặt lịch trực tiếp trên trang web.')
    activeBooking.value = null
  } finally {
    isLoading.value = false
  }
}

async function resolvePatientProfileIfNeeded() {
  if (authStore.user?.patientId || !authStore.isAuthenticated) return
  await authStore.resolvePatientProfile().catch(() => undefined)
}

function newestByDate<T extends LooseRecord>(items: T[] = [], dateKeys: string[]) {
  if (!items.length) return undefined

  return [...items].sort((left, right) => itemTime(right, dateKeys) - itemTime(left, dateKeys))[0]
}

function newestUpcomingAppointment(items: LooseRecord[]) {
  return items
    .filter((item) => !isClosedAppointmentStatus(stringValue(item.status, item.Status)))
    .filter((item) => appointmentTimestamp(item) >= Date.now() - 15 * 60 * 1000)
    .sort((left, right) => appointmentTimestamp(left) - appointmentTimestamp(right))[0]
}

function itemTime(item: LooseRecord, dateKeys: string[]) {
  for (const key of dateKeys) {
    const value = item[key] ?? item[toPascalCase(key)]
    const time = new Date(String(value || '')).getTime()
    if (Number.isFinite(time)) return time
  }
  return 0
}

function appointmentTimestamp(item: LooseRecord) {
  const date = stringValue(item.appointmentDate, item.AppointmentDate, item.scheduledAt, item.ScheduledAt)
  const time = stringValue(item.slotTime, item.SlotTime, item.time, item.Time) || '00:00'
  const normalizedDate = date.slice(0, 10)
  const normalizedTime = time.slice(0, 5)
  const value = normalizedDate ? `${normalizedDate}T${normalizedTime}:00` : date
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function isClosedAppointmentStatus(status?: string) {
  const value = String(status || '').toLowerCase()
  return ['cancel', 'completed', 'done', 'noshow', 'expired', 'hủy'].some((keyword) => value.includes(keyword))
}

function isUnpaidInvoice(invoice: LooseRecord) {
  const status = stringValue(invoice.status, invoice.invoiceStatus, invoice.Status, invoice.InvoiceStatus).toLowerCase()
  const balanceDue = numberValue(invoice.balanceDue, invoice.BalanceDue)
  if (balanceDue > 0) return true
  return status.includes('unpaid') || status.includes('pending') || status.includes('chưa') || status.includes('not paid')
}

function prescriptionItems(prescription: LooseRecord) {
  const value = prescription.items ?? prescription.Items ?? prescription.prescriptionItems ?? prescription.PrescriptionItems
  return Array.isArray(value) ? value as LooseRecord[] : []
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? '').trim()
    if (text) return text
  }
  return ''
}

function compactNotification(value: string) {
  const text = value.replace(/\s+/g, ' ').trim()
  if (text.length <= 72) return text
  return `${text.slice(0, 69).trimEnd()}...`
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    const number = Number(value ?? 0)
    if (Number.isFinite(number) && number > 0) return number
  }
  return 0
}

function toPascalCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatAppointmentDateTime(item: LooseRecord) {
  const date = stringValue(item.appointmentDate, item.AppointmentDate, item.scheduledAt, item.ScheduledAt)
  const time = stringValue(item.slotTime, item.SlotTime, item.time, item.Time)
  const dateText = formatDate(date) || 'ngày chưa rõ'
  const timeText = time ? ` lúc ${time.slice(0, 5)}` : ''
  return `${dateText}${timeText}`
}

function translateInvoiceStatus(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('unpaid')) return 'Chưa thanh toán'
  if (normalized.includes('paid')) return 'Đã thanh toán'
  if (normalized.includes('cancel')) return 'Đã hủy'
  return value
}

function quickActionIcon(key: QuickActionKey): Component {
  if (key === 'booking') return CalendarClock
  if (key === 'symptom') return Stethoscope
  if (key === 'prescription') return Pill
  if (key === 'invoice') return ReceiptText
  return FileHeart
}
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.assistant-returning {
  transition:
    bottom 520ms cubic-bezier(0.34, 1.56, 0.64, 1),
    right 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dogky-cloud-bubble {
  transform-origin: 76% 92%;
  will-change: opacity, transform;
}

.dogky-cloud-text {
  max-width: 10rem;
  font-weight: 700;
  overflow-wrap: anywhere;
  color: #1e293b !important;
}

.dogky-cloud-enter-active {
  transition:
    opacity 420ms ease-out,
    transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dogky-cloud-leave-active {
  transition:
    opacity 260ms ease-in,
    transform 320ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dogky-cloud-enter-from,
.dogky-cloud-leave-to {
  opacity: 0;
  transform: translate(3.6rem, 3.1rem) scale(0.08) rotate(2deg);
}

.dogky-cloud-enter-to,
.dogky-cloud-leave-from {
  opacity: 1;
  transform: translate(0, 0) scale(1) rotate(0);
}

.dogky-sidebar {
  border-radius: inherit;
  overflow: hidden;
}
</style>
