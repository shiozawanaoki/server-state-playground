import { Loader2 } from 'lucide-react'
import type { Todo } from '@server-state-playground/shared'
import type { TodoFormValues } from '@/components/TodoForm'
import { TodoForm } from '@/components/TodoForm'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'

export interface TodoDetailViewProps {
  todo: Todo | undefined
  isPending: boolean
  isMutating: boolean
  fetchError: string | null
  mutationError: string | null
  onSubmit: (data: TodoFormValues) => Promise<void>
  onCancel: () => void
  onDelete: () => void
  listPath: string
  listLabel: string
}

export function TodoDetailView({
  todo,
  isPending,
  isMutating,
  fetchError,
  mutationError,
  onSubmit,
  onCancel,
  onDelete,
  listPath,
  listLabel,
}: TodoDetailViewProps) {
  const breadcrumb = (
    <PageBreadcrumb items={[
      { label: 'Home', to: '/' },
      { label: listLabel, to: listPath },
      { label: '詳細' },
    ]} />
  )

  if (isPending) return (
    <div className="max-w-2xl mx-auto p-6">
      {breadcrumb}
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )

  if (fetchError || !todo) return (
    <div className="max-w-2xl mx-auto p-6">
      {breadcrumb}
      <p className="text-destructive">{fetchError ?? 'Not Found'}</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-6">
      {breadcrumb}
      <h1 className="text-2xl font-bold mb-6">Todo詳細</h1>
      <TodoForm
        mode="edit"
        defaultValues={{ title: todo.title, description: todo.description, status: todo.status }}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDelete={onDelete}
        isPending={isMutating}
        serverError={mutationError}
        submitLabel="更新"
        pendingLabel="更新中..."
      />
    </div>
  )
}
