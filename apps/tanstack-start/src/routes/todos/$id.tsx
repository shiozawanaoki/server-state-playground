import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { getTodo, updateTodo, deleteTodo } from '../../server/todos'
import type { TodoStatus } from '@server-state-playground/shared'

const todoQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['todos', id],
    queryFn: () => getTodo({ data: { id } }),
  })

export const Route = createFileRoute('/todos/$id')({
  component: TodoDetailPage,
})

function TodoDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: todo, isLoading, isError } = useQuery(todoQueryOptions(id))

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TodoStatus>('todo')

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description)
      setStatus(todo.status)
    }
  }, [todo])

  const updateMutation = useMutation({
    mutationFn: () => updateTodo({ data: { id, title, description, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTodo({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      navigate({ to: '/todos' })
    },
  })

  if (isLoading) return <div className="max-w-2xl mx-auto p-6">読み込み中...</div>
  if (isError || !todo)
    return <div className="max-w-2xl mx-auto p-6 text-red-500">Todoが見つかりません</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Todo編集</h1>
        <button
          onClick={() => navigate({ to: '/todos' })}
          className="text-gray-600 hover:text-gray-800"
        >
          ← 一覧に戻る
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          updateMutation.mutate()
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">タイトル *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ステータス</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TodoStatus)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todo">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="done">完了</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {updateMutation.isPending ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('このTodoを削除しますか？')) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            {deleteMutation.isPending ? '削除中...' : '削除'}
          </button>
        </div>

        {updateMutation.isSuccess && (
          <p className="text-green-500 text-sm">保存しました</p>
        )}
        {updateMutation.isError && (
          <p className="text-red-500 text-sm">
            エラー: {updateMutation.error?.message}
          </p>
        )}
      </form>
    </div>
  )
}
