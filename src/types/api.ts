export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors: string[]
}

export interface ApiErrorState {
  message: string
  errors?: string[]
}
