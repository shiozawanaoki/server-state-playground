import type { ReactNode } from 'react'
import { Circle, Clock, CircleCheck } from 'lucide-react'
import type { TodoStatus } from '@server-state-playground/shared'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type FilterValue = 'all' | TodoStatus

const FILTERS: ReadonlyArray<{ value: FilterValue; label: string; icon: ReactNode }> = [
  { value: 'all', label: 'すべて', icon: null },
  { value: 'todo', label: 'Todo', icon: <Circle className="size-3" /> },
  { value: 'in_progress', label: '進行中', icon: <Clock className="size-3" /> },
  { value: 'done', label: '完了', icon: <CircleCheck className="size-3" /> },
]

export interface TodoStatusFilterProps {
  status: TodoStatus | null
  onChange: (status: TodoStatus | null) => void
}

export function TodoStatusFilter({ status, onChange }: TodoStatusFilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={status ?? 'all'}
      onValueChange={(value: string) => onChange(value === 'all' ? null : value as TodoStatus)}
      className="mb-4"
      size="sm"
      spacing={2}
    >
      {FILTERS.map(({ value, label, icon }) => (
        <ToggleGroupItem key={value} value={value} className="gap-1">
          {icon}
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
