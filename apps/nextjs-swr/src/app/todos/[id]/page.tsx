'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { useSWRConfig } from 'swr'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Todo, UpdateTodoInput } from '@server-state-playground/shared'

async function putTodo(url: string, { arg }: { arg: UpdateTodoInput }): Promise<Todo> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  if (!res.ok) throw new Error('更新に失敗しました')
  return res.json()
}

async function deleteTodo(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) throw new Error('削除に失敗しました')
}

export default function TodoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { mutate } = useSWRConfig()

  const { data: todo, isLoading, error } = useSWR<Todo>(`/api/todos/${id}`)
  const { trigger: updateTrigger, isMutating: isUpdating } = useSWRMutation(`/api/todos/${id}`, putTodo)
  const { trigger: deleteTrigger, isMutating: isDeleting } = useSWRMutation(`/api/todos/${id}`, deleteTodo)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description)
      setStatus(todo.status)
    }
  }, [todo])

  async function handleUpdate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    await updateTrigger({ title, description, status })
    await mutate(`/api/todos/${id}`)
    await mutate(key => typeof key === 'string' && key.startsWith('/api/todos') && !key.includes(`/${id}`), undefined, { revalidate: true })
  }

  async function handleDelete() {
    if (!confirm('削除しますか？')) return
    await deleteTrigger()
    await mutate(key => typeof key === 'string' && key.startsWith('/api/todos'), undefined, { revalidate: true })
    router.push('/todos')
  }

  if (isLoading) return <div className="max-w-2xl mx-auto p-6 text-gray-500">読み込み中...</div>
  if (error || !todo) return <div className="max-w-2xl mx-auto p-6 text-red-500">Todoが見つかりません</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/todos" className="text-blue-600 hover:underline">← 一覧に戻る</Link>
        <h1 className="text-2xl font-bold">Todo詳細</h1>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">タイトル *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ステータス</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as typeof status)}
            className="border rounded px-3 py-2"
          >
            <option value="todo">Todo</option>
            <option value="in_progress">進行中</option>
            <option value="done">完了</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isUpdating ? '更新中...' : '更新'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? '削除中...' : '削除'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-xs text-gray-400">
        <p>作成: {new Date(todo.createdAt).toLocaleString('ja-JP')}</p>
        <p>更新: {new Date(todo.updatedAt).toLocaleString('ja-JP')}</p>
      </div>
    </div>
  )
}
