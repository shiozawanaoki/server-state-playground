import { useNavigate, useSearchParams } from 'react-router'
import { todoStatusSchema } from '@server-state-playground/shared'
import { TodoListView } from '@/components/TodoListView'
import { useTodos } from './hooks'

export function TodoList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const parsed = todoStatusSchema.safeParse(searchParams.get('status'))
  const status = parsed.success ? parsed.data : null
  const { todos, isPending, error } = useTodos(status)

  return (
    <TodoListView
      todos={todos}
      isPending={isPending}
      error={error}
      status={status}
      onStatusChange={(s) => setSearchParams(s ? { status: s } : {})}
      onNew={() => navigate('/swr/new')}
      basePath="/swr"
      label="Todos (SWR)"
    />
  )
}
