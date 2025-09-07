export interface ApiErrorDetails {
  [key: string]: string[] | undefined
}

export interface ApiErrorPayload {
  code?: string
  message?: string
  error?: { message?: string; code?: string; details?: ApiErrorDetails } | string
  details?: ApiErrorDetails
}

export interface ApiResponse<T> {
  success?: boolean
  data?: T
  error?: ApiErrorPayload
}
