import { createFileRoute, Link } from '@tanstack/react-router'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { getTodos } from '../../server/todos'

const todosQueryOptions = (status?: string) =>
  queryOptions({
    queryKey: ['todos', { status }],
    queryFn: () => getTodos({ data: { status } }),
  })

const STATUS_OPTIONS = [
  { value: '', label: 'すべて' },
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'done', label: '完了' },
] as const

export const Route = createFileRoute('/todos/')({
  validateSearch: (search: Record<string, unknown>) => ({
    status: (search.status as string) ?? '',
  }),
  component: TodosPage,
})

function TodosPage() {
  const { status } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: todos, isLoading, isError } = useQuery(todosQueryOptions(status || undefined))

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Todoリスト</h1>
        <Link
          to="/todos/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          新規作成
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => navigate({ search: { status: opt.value } })}
            className={`px-3 py-1 rounded ${
              status === opt.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-gray-500">読み込み中...</p>}
      {isError && <p className="text-red-500">エラーが発生しました</p>}

      {todos && (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id}>
              <Link
                to="/todos/$id"
                params={{ id: todo.id }}
                className="block p-4 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{todo.title}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      todo.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : todo.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {todo.status === 'done'
                      ? '完了'
                      : todo.status === 'in_progress'
                        ? '進行中'
                        : '未着手'}
                  </span>
                </div>
                {todo.description && (
                  <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                )}
              </Link>
            </li>
          ))}
          {todos.length === 0 && (
            <p className="text-gray-500 text-center py-8">Todoがありません</p>
          )}
        </ul>
      )}
    </div>
  )
}
