import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createTodo } from '../../server/todos'
import type { TodoStatus } from '@server-state-playground/shared'

export const Route = createFileRoute('/todos/new')({
  component: NewTodoPage,
})

function NewTodoPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TodoStatus>('todo')

  const mutation = useMutation({
    mutationFn: () => createTodo({ data: { title, description, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      navigate({ to: '/todos' })
    },
  })

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">新規Todo作成</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
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
            disabled={mutation.isPending}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {mutation.isPending ? '作成中...' : '作成'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/todos' })}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            キャンセル
          </button>
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm">エラー: {mutation.error?.message}</p>
        )}
      </form>
    </div>
  )
}
