'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import type { Todo, TodoStatus } from '@server-state-playground/shared'

export default function TodosPage() {
  const [status, setStatus] = useState<TodoStatus | ''>('')
  const key = status ? `/api/todos?status=${status}` : '/api/todos'
  const { data: todos, isLoading } = useSWR<Todo[]>(key)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Todo一覧</h1>
        <Link href="/todos/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          新規作成
        </Link>
      </div>

      <select
        value={status}
        onChange={e => setStatus(e.target.value as TodoStatus | '')}
        className="border rounded px-3 py-2 text-sm mb-4"
      >
        <option value="">すべて</option>
        <option value="todo">Todo</option>
        <option value="in_progress">進行中</option>
        <option value="done">完了</option>
      </select>

      {isLoading && <p className="text-gray-500">読み込み中...</p>}

      <ul className="space-y-2">
        {todos?.map(todo => (
          <li key={todo.id}>
            <Link href={`/todos/${todo.id}`} className="flex justify-between p-4 border rounded hover:bg-gray-50">
              <span>{todo.title}</span>
              <span className="text-sm text-gray-500">{todo.status}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
