/**
 * vanilla パターン — ライブラリなし、React 標準の useState + useEffect だけで実装
 *
 * このファイルが示す「手動管理」の課題:
 *   - ローディング・エラー状態を自分で useState で持ち、fetch のたびに手動でセットする
 *   - キャッシュなし → 同じデータを複数コンポーネントが使うと都度 fetch が走る
 *   - 重複リクエストの排除なし → 短時間に同じ URL を複数回呼ぶと全部飛ぶ
 *   - ミューテーション後の一覧更新なし → 作成・更新・削除しても一覧は自動で変わらない
 *
 * SWR / TanStack Query を使うと、これらが自動で解決される（他のhooks.tsと比較してみよう）
 */

import { useState, useEffect } from 'react'
import type { Todo, TodoStatus } from '@server-state-playground/shared'
import { fakeFetch } from '../../lib/fake-fetch'

type MutationData = { title: string; description: string; status: TodoStatus }

/**
 * Todo 一覧を取得する hook
 *
 * useEffect の依存配列に [status] を渡すことで、
 * status が変わるたびに fetch がやり直される。
 * ただしキャッシュはないため、同じ status に戻っても再度 fetch が走る。
 *
 * race condition 対策:
 *   status を素早く切り替えると、先に発行されたリクエストの応答が後から到着し、
 *   古い結果で state が上書きされることがある（race condition）。
 *   `cancelled` フラグでクリーンアップ時に古いレスポンスを無視することで防ぐ。
 *   SWR / TanStack Query ではこの問題がライブラリ内部で自動的に解決されるため、
 *   この考慮は不要になる。
 */
export function useTodos(status: TodoStatus | null) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false // このエフェクトが古くなったらフラグを立てる
    setTodos([]) // キャッシュがないため、前のフィルタのデータをクリアする
    setIsPending(true)
    setError(null)
    const url = status ? `/api/todos?status=${status}` : '/api/todos'
    fakeFetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch todos')
        return res.json() as Promise<Todo[]>
      })
      .then((data) => { if (!cancelled) setTodos(data) })
      .catch((e: unknown) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setIsPending(false) })
    return () => { cancelled = true } // deps 変更またはアンマウント時に古いレスポンスを無視
  }, [status])

  return { todos, isPending, error }
}

/**
 * 特定の Todo を1件取得する hook
 *
 * id が undefined（URL にまだ id がない）のときは fetch しない。
 * ライブラリなしでは「条件付きフェッチ」も自分で if で制御する必要がある。
 * SWR では useSWR(id ? url : null)、TanStack Query では enabled オプションで同じことができる。
 *
 * race condition 対策: useTodos と同様に `cancelled` フラグでクリーンアップする。
 * SWR / TanStack Query ではこの考慮は不要。
 */
export function useTodo(id: string | undefined) {
  const [todo, setTodo] = useState<Todo | undefined>(undefined)
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return // id がなければ何もしない（条件付きフェッチを手動で実現）
    let cancelled = false
    setIsPending(true)
    setError(null)
    fakeFetch(`/api/todos/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not Found')
        const data: Todo = await res.json()
        if (!cancelled) setTodo(data)
      })
      .catch((e: unknown) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setIsPending(false) })
    return () => { cancelled = true }
  }, [id])

  return { todo, isPending, error }
}

/**
 * Todo を作成する hook
 *
 * ミューテーション用の状態（isPending, error）を useState で自前管理する。
 * 作成成功後に一覧キャッシュを更新する仕組みはないため、
 * ページ遷移（navigate）によって一覧ページが再マウントされ再 fetch される。
 * このとき毎回 isPending=true → スピナーが表示される。
 * SWR / TanStack Query ではキャッシュがあるため、古いデータを即座に表示しつつ
 * バックグラウンドで再取得するのでスピナーは出ない。
 */
export function useCreateTodo() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (data: MutationData) => {
    setIsPending(true)
    setError(null)
    try {
      const res = await fakeFetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        const message = String(body.error ?? 'Failed to create')
        setError(message) // state に保存してから throw → 呼び出し元の catch でも参照可能
        throw new Error(message)
      }
    } finally {
      setIsPending(false)
    }
  }

  return { create, isPending, error }
}

/**
 * Todo を更新する hook
 *
 * useCreateTodo と同じパターン。
 * 更新後の一覧・詳細の再取得は呼び出し元（ページ遷移）に任せる。
 */
export function useUpdateTodo(id: string | undefined) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (data: MutationData) => {
    if (!id) throw new Error('id is required')
    setIsPending(true)
    setError(null)
    try {
      const res = await fakeFetch(`/api/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        const message = String(body.error ?? 'Failed to update')
        setError(message)
        throw new Error(message)
      }
    } finally {
      setIsPending(false)
    }
  }

  return { update, isPending, error }
}

/**
 * Todo を削除する hook
 */
export function useDeleteTodo(id: string | undefined) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async () => {
    if (!id) throw new Error('id is required')
    setIsPending(true)
    setError(null)
    try {
      const res = await fakeFetch(`/api/todos/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        const message = String(body.error ?? 'Failed to delete')
        setError(message)
        throw new Error(message)
      }
    } finally {
      setIsPending(false)
    }
  }

  return { remove, isPending, error }
}
