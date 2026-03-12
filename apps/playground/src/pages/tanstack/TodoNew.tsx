import { useNavigate } from 'react-router'
import type { TodoFormValues } from '@/components/TodoForm'
import { TodoNewView } from '@/components/TodoNewView'
import { useCreateTodo } from './hooks'

export function TodoNew() {
  const navigate = useNavigate()
  const { create, isPending, error } = useCreateTodo()

  const handleSubmit = async (data: TodoFormValues) => {
    try {
      await create(data)
      navigate('/tanstack')
    } catch {
      // エラーは useCreateTodo の error で表示
    }
  }

  return (
    <TodoNewView
      isPending={isPending}
      error={error}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/tanstack')}
      listPath="/tanstack"
      listLabel="Todos (TanStack Query)"
    />
  )
}
