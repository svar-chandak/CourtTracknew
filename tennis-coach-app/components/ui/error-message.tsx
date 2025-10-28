import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  message: string
  className?: string
  showIcon?: boolean
}

export function ErrorMessage({ message, className, showIcon = true }: ErrorMessageProps) {
  return (
    <div className={cn('flex items-center gap-2 text-red-600 text-sm', className)}>
      {showIcon && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      <span>{message}</span>
    </div>
  )
}
