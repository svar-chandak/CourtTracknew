import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuccessMessageProps {
  message: string
  className?: string
  showIcon?: boolean
}

export function SuccessMessage({ message, className, showIcon = true }: SuccessMessageProps) {
  return (
    <div className={cn('flex items-center gap-2 text-green-600 text-sm', className)}>
      {showIcon && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
      <span>{message}</span>
    </div>
  )
}
