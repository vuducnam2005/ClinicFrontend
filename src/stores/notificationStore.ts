import * as signalR from '@microsoft/signalr'
import { defineStore } from 'pinia'
import { createServiceClient, apiConfig, readApiResponse } from '@/services/apiClient'
import { useAuthStore } from '@/stores/authStore'

export interface NotificationItem {
  id: number
  userId: number
  role: string
  title: string
  content: string
  type: 'Appointment' | 'Billing' | 'Prescription' | 'MedicalRecord' | 'System' | string
  referenceId?: string | null
  navigateUrl: string
  isRead: boolean
  createdAt: string
}

const client = createServiceClient('billing')

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function notificationHubUrl() {
  const baseUrl = apiConfig.useGateway ? apiConfig.gatewayUrl : apiConfig.urls.billing
  const prefix = apiConfig.useGateway ? '/pharmacy' : ''
  return joinUrl(baseUrl, `${prefix}/hub/notifications`)
}

function normalizeNotification(item: Record<string, any>): NotificationItem {
  return {
    id: Number(item.id ?? item.Id),
    userId: Number(item.userId ?? item.UserId),
    role: item.role ?? item.Role ?? '',
    title: item.title ?? item.Title ?? '',
    content: item.content ?? item.Content ?? '',
    type: item.type ?? item.Type ?? 'System',
    referenceId: item.referenceId ?? item.ReferenceId ?? null,
    navigateUrl: item.navigateUrl ?? item.NavigateUrl ?? '/',
    isRead: Boolean(item.isRead ?? item.IsRead),
    createdAt: item.createdAt ?? item.CreatedAt ?? new Date().toISOString(),
  }
}

function normalizeNotificationList(payload: unknown): NotificationItem[] {
  const data = readApiResponse<any>(payload as any)
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.Items)
        ? data.Items
        : []
  return items.map(normalizeNotification)
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as NotificationItem[],
    unreadCount: 0,
    hubConnection: null as signalR.HubConnection | null,
    loading: false,
    toast: {
      show: false,
      title: '',
      message: '',
      type: 'success' as 'success' | 'error',
    },
  }),
  getters: {
    unreadNotifications: (state) => state.notifications.filter((item) => !item.isRead),
  },
  actions: {
    async fetchNotifications(isRead?: boolean) {
      this.loading = true
      try {
        const response = await client.get('/api/notifications', {
          params: {
            page: 1,
            pageSize: 20,
            ...(typeof isRead === 'boolean' ? { isRead } : {}),
          },
        })
        this.notifications = normalizeNotificationList(response.data)
      } finally {
        this.loading = false
      }
    },
    async fetchUnreadCount() {
      const response = await client.get('/api/notifications/unread-count')
      const data = readApiResponse<any>(response.data)
      this.unreadCount = Number(data?.count ?? data?.Count ?? 0)
    },
    async markAsRead(id: number) {
      const notification = this.notifications.find((item) => item.id === id)
      const wasUnread = notification ? !notification.isRead : false
      const response = await client.post(`/api/notifications/${id}/read`)
      const updated = normalizeNotification(readApiResponse<any>(response.data))

      this.notifications = this.notifications.map((item) => (item.id === id ? updated : item))
      if (wasUnread) this.unreadCount = Math.max(0, this.unreadCount - 1)
    },
    async markAllAsRead() {
      await client.post('/api/notifications/read-all')
      this.notifications = this.notifications.map((item) => ({ ...item, isRead: true }))
      this.unreadCount = 0
    },
    async initSignalR() {
      const authStore = useAuthStore()
      if (!authStore.token) return
      if (this.hubConnection?.state === signalR.HubConnectionState.Connected) return

      if (this.hubConnection) {
        await this.disconnectSignalR()
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(notificationHubUrl(), {
          accessTokenFactory: () => useAuthStore().token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .build()

      connection.on('ReceiveNotification', (payload: Record<string, any>) => {
        const notification = normalizeNotification(payload)
        this.notifications = [
          notification,
          ...this.notifications.filter((item) => item.id !== notification.id),
        ].slice(0, 20)

        if (!notification.isRead) this.unreadCount += 1

        this.toast.title = notification.title || 'Thông báo mới'
        this.toast.message = notification.content || 'Bạn vừa nhận được thông báo mới.'
        this.toast.type = 'success'
        this.toast.show = true
      })

      this.hubConnection = connection

      try {
        await connection.start()
      } catch (error) {
        console.warn('Không thể kết nối chuông thông báo realtime', error)
      }
    },
    async disconnectSignalR() {
      if (!this.hubConnection) return
      const connection = this.hubConnection
      this.hubConnection = null
      await connection.stop().catch(() => undefined)
    },
    hideToast() {
      this.toast.show = false
    },
  },
})
