import { Link } from 'react-router'
import { Circle, Clock, CircleCheck } from 'lucide-react'
import type { Todo, TodoStatus } from '@server-state-playground/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_LABEL: Record<TodoStatus, string> = {
  todo: 'Todo',
  in_progress: '進行中',
  done: '完了',
}

const STATUS_VARIANT: Record<TodoStatus, 'outline' | 'secondary' | 'default'> = {
  todo: 'outline',
  in_progress: 'secondary',
  done: 'default',
}

const STATUS_ICON = {
  todo: <Circle className="size-3" />,
  in_progress: <Clock className="size-3" />,
  done: <CircleCheck className="size-3" />,
} satisfies Record<TodoStatus, React.ReactNode>

export interface TodoItemProps {
  todo: Todo
  basePath: string
}

export function TodoItem({ todo, basePath }: TodoItemProps) {
  return (
    <li>
      <Link to={`${basePath}/${todo.id}`}>
        <Card size="sm" className="hover:bg-accent transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <span className="font-medium">{todo.title}</span>
              {todo.description && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{todo.description}</p>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[todo.status]} className="ml-4 shrink-0 gap-1">
              {STATUS_ICON[todo.status]}
              {STATUS_LABEL[todo.status]}
            </Badge>
          </CardContent>
        </Card>
      </Link>
    </li>
  )
}
