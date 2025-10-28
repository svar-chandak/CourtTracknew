// API Response Types
export interface ApiResponse<T = any> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Database operation result types
export interface DatabaseResult<T = any> {
  data: T | null
  error: DatabaseError | null
}

export interface DatabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

// Form state types
export interface FormState<T = any> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
}

// Loading state types
export interface LoadingState {
  isLoading: boolean
  error: string | null
  lastUpdated?: Date
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface DialogProps extends BaseComponentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface FormProps<T = any> extends BaseComponentProps {
  onSubmit: (data: T) => void | Promise<void>
  initialData?: Partial<T>
  validationSchema?: any
}

// Enhanced type guards
export function isApiResponse<T>(value: any): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'error' in value &&
    'success' in value
  )
}

export function isPaginatedResponse<T>(value: any): value is PaginatedResponse<T> {
  return (
    isApiResponse<T[]>(value) &&
    'pagination' in value &&
    typeof value.pagination === 'object'
  )
}

export function isDatabaseError(value: any): value is DatabaseError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  )
}

// Utility types for better type safety
export type NonNullable<T> = T extends null | undefined ? never : T

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

// Event handler types
export type EventHandler<T = Event> = (event: T) => void

export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>

// Generic utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// Status types
export type Status = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T = any> {
  status: Status
  data: T | null
  error: string | null
}

// Filter and sort types
export interface FilterOptions {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: any
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginationOptions {
  page: number
  limit: number
  sort?: SortOptions
  filters?: FilterOptions
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  theme: Theme
  primaryColor: string
  secondaryColor: string
}

// User preferences types
export interface UserPreferences {
  theme: Theme
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  language: string
  timezone: string
}

// Search and filter utilities
export interface SearchResult<T> {
  items: T[]
  total: number
  query: string
  filters: FilterOptions
}

export interface SearchOptions {
  query?: string
  filters?: FilterOptions
  sort?: SortOptions
  pagination?: PaginationOptions
}

// File upload types
export interface FileUpload {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
}

export interface UploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  multiple?: boolean
}

// Real-time subscription types
export interface RealtimeSubscription {
  channel: string
  event: string
  callback: (payload: any) => void
}

export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  schema: string
  table: string
  commit_timestamp: string
  old_record?: T
  new_record?: T
}

// Cache types
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

export interface CacheOptions {
  ttl?: number
  maxSize?: number
  strategy?: 'lru' | 'fifo' | 'ttl'
}
