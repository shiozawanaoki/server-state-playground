'use client'

import useSWRMutation from 'swr/mutation'
import { useSWRConfig } from 'swr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import type { CreateTodoInput, Todo } from '@server-state-playground/shared'

async function postTodo(url: string, { arg }: { arg: CreateTodoInput }): Promise<Todo> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  if (!res.ok) throw new Error('作成失敗')
  return res.json()
}

export default function NewTodoPage() {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { trigger, isMutating } = useSWRMutation('/api/todos', postTodo)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    await trigger({ title, description })
    await mutate('/api/todos')
    router.push('/todos')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href="/todos" className="text-blue-600 hover:underline text-sm">← 戻る</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">新規作成</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">タイトル</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" disabled={isMutating} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {isMutating ? '作成中...' : '作成'}
        </button>
      </form>
    </div>
  )
}
