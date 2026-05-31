import axios, { AxiosError, type AxiosInstance } from 'axios'
import type { ApiResponse } from '@/types/api'

type ServiceName = 'appointment' | 'medicalRecord' | 'billing'

const useGateway = import.meta.env.VITE_USE_GATEWAY === 'true'

const urls: Record<ServiceName, string> = {
  appointment: import.meta.env.VITE_APPOINTMENT_SERVICE_URL || 'http://180.93.98.14:8080/appointment',
  medicalRecord: import.meta.env.VITE_MEDICAL_RECORD_SERVICE_URL || 'http://180.93.98.14:8080/medical',
  billing: import.meta.env.VITE_PHARMACY_BILLING_SERVICE_URL || 'http://180.93.98.14:8080/pharmacy',
}

export const apiConfig = {
  useGateway,
  gatewayUrl: import.meta.env.VITE_API_GATEWAY_URL || 'http://180.93.98.14:8080/apigateway',
  urls,
}

export function createServiceClient(service: ServiceName): AxiosInstance {
  const client = axios.create({
    baseURL: useGateway ? apiConfig.gatewayUrl : urls[service],
    timeout: 9000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('cliniccare_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const hadToken = Boolean(localStorage.getItem('cliniccare_token'))
      if (error.response?.status === 401 && hadToken) {
        localStorage.removeItem('cliniccare_token')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return client
}

export function readApiResponse<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const response = payload as ApiResponse<T>
    if (!response.success) {
      throw new Error(response.message || 'API request failed')
    }
    return response.data
  }
  return payload as T
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>
    return axiosError.response?.data?.message || axiosError.message || 'Không thể kết nối API'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Đã có lỗi xảy ra'
}
