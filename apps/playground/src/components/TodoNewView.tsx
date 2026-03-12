import type { TodoFormValues } from '@/components/TodoForm'
import { TodoForm } from '@/components/TodoForm'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'

export interface TodoNewViewProps {
  isPending: boolean
  error: string | null
  onSubmit: (data: TodoFormValues) => Promise<void>
  onCancel: () => void
  listPath: string
  listLabel: string
}

export function TodoNewView({
  isPending,
  error,
  onSubmit,
  onCancel,
  listPath,
  listLabel,
}: TodoNewViewProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <PageBreadcrumb items={[
        { label: 'Home', to: '/' },
        { label: listLabel, to: listPath },
        { label: '新規作成' },
      ]} />
      <h1 className="text-2xl font-bold mb-6">新規Todo作成</h1>
      <TodoForm
        mode="create"
        onSubmit={onSubmit}
        onCancel={onCancel}
        isPending={isPending}
        serverError={error}
        submitLabel="作成"
        pendingLabel="作成中..."
      />
    </div>
  )
}
