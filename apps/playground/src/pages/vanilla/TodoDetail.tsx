import { useParams, useNavigate } from 'react-router'
import type { TodoFormValues } from '@/components/TodoForm'
import { TodoDetailView } from '@/components/TodoDetailView'
import { useTodo, useUpdateTodo, useDeleteTodo } from './hooks'

export function TodoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { todo, isPending, error: fetchError } = useTodo(id)
  const { update, isPending: saving, error: updateError } = useUpdateTodo(id)
  const { remove, isPending: deleting, error: deleteError } = useDeleteTodo(id)

  const handleSubmit = async (data: TodoFormValues) => {
    try {
      await update(data)
      navigate('/vanilla')
    } catch {
      // エラーは useUpdateTodo の error で表示
    }
  }

  const handleDelete = async () => {
    if (!confirm('削除しますか？')) return
    try {
      await remove()
      navigate('/vanilla')
    } catch {
      // エラーは useDeleteTodo の error で表示
    }
  }

  return (
    <TodoDetailView
      todo={todo}
      isPending={isPending}
      isMutating={saving || deleting}
      fetchError={fetchError}
      mutationError={updateError ?? deleteError}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/vanilla')}
      onDelete={handleDelete}
      listPath="/vanilla"
      listLabel="Todos (useEffect)"
    />
  )
}
