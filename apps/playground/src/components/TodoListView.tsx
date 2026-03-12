import { Plus, Loader2 } from 'lucide-react'
import type { Todo, TodoStatus } from '@server-state-playground/shared'
import { Button } from '@/components/ui/button'
import { TodoItem } from '@/components/TodoItem'
import { TodoStatusFilter } from '@/components/TodoStatusFilter'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'

export interface TodoListViewProps {
  todos: Todo[]
  isPending: boolean
  error: string | null
  status: TodoStatus | null
  onStatusChange: (status: TodoStatus | null) => void
  onNew: () => void
  basePath: string
  label: string
}

export function TodoListView({
  todos,
  isPending,
  error,
  status,
  onStatusChange,
  onNew,
  basePath,
  label,
}: TodoListViewProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <PageBreadcrumb items={[
        { label: 'Home', to: '/' },
        { label },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{label}</h1>
        <Button onClick={onNew}>
          <Plus className="size-4" />
          新規作成
        </Button>
      </div>

      <TodoStatusFilter status={status} onChange={onStatusChange} />

      {isPending && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && <p className="text-destructive">エラー: {error}</p>}
      {!isPending && !error && todos.length === 0 && (
        <p className="text-muted-foreground">Todoがありません</p>
      )}

      <ul className="space-y-2">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} basePath={basePath} />
        ))}
      </ul>
    </div>
  )
}
