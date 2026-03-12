/**
 * reducer パターン — useReducer + Context で共有キャッシュを実現
 *
 * vanilla パターンとの違い（差分に注目）:
 *   - vanilla: 各コンポーネントが独立して fetch → コンポーネント間でデータを共有しない
 *   - reducer: dispatch で共有キャッシュを更新 → 全コンポーネントが最新データを参照できる
 *
 * SWR / TanStack Query との違い:
 *   - fetch ライフサイクル（loading/error/race condition）は自前で管理する必要がある
 *   - stale-while-revalidate（キャッシュを即表示しつつバックグラウンド再取得）は手動実装
 *   - キャッシュキーの分離がないため、status ごとのキャッシュ最適化はできない
 */

import { useState, useEffect, useMemo } from 'react'
import type { Todo, TodoStatus } from '@server-state-playground/shared'
import { fakeFetch } from '../../lib/fake-fetch'
import { useTodosState, useTodosDispatch } from './context'

type MutationData = { title: string; description: string; status: TodoStatus }

/**
 * Todo 一覧を取得する hook
 *
 * vanilla との違い:
 *   - fetch 結果を dispatch で共有キャッシュに書き込む
 *   - 他の hook（useCreateTodo 等）がキャッシュを更新すると、
 *     この hook の返すデータも自動的に最新になる
 *
 * キャッシュ戦略:
 *   常に全件（/api/todos）を fetch して共有キャッシュに保持。
 *   フィルタはクライアント側の useMemo で行う。
 *   → 共有キャッシュのメリット（useTodo でのキャッシュヒット）を活かすには全件が必要
 *   → SWR/TanStack Query ならキーごとにキャッシュを分けるため、この trade-off が不要（比較ポイント）
 *
 * isPending のセマンティクス（useTodo と同様のキャッシュ考慮型）:
 *   共有キャッシュに Todo が1件でもあればスピナーなし（即座に表示）。
 *   キャッシュが空のときだけ fetch 中にスピナーを表示する。
 *   → 全件キャッシュ + useMemo フィルタにより stale-while-revalidate が実現できている。
 *   SWR/TanStack Query との違いは「キャッシュキーの分離がなく単一キャッシュである」点のみ（比較ポイント）。
 */
export function useTodos(status: TodoStatus | null) {
  const { todos: allTodos } = useTodosState()
  const dispatch = useTodosDispatch()
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsFetching(true)
    setError(null)
    // 常に全件取得してキャッシュに保持。フィルタはクライアント側で行う
    fakeFetch('/api/todos')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch todos')
        return res.json() as Promise<Todo[]>
      })
      .then((data) => {
        if (!cancelled) {
          // ★ vanilla と異なり、ローカル state ではなく共有キャッシュに書き込む
          dispatch({ type: 'SET_TODOS', payload: data })
        }
      })
      .catch((e: unknown) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setIsFetching(false) })
    return () => { cancelled = true }
  // status を deps に含めるのは、status 変更時に再 fetch してキャッシュを最新化するため
  // （ただし URL は常に /api/todos なので同じリクエストが飛ぶ。
  //  SWR/TanStack Query ならキー別キャッシュで不要な再 fetch を避けられる ← 比較ポイント）
  }, [status, dispatch])

  // 共有キャッシュからクライアント側でフィルタ
  const todos = useMemo(
    () => status ? allTodos.filter(t => t.status === status) : allTodos,
    [allTodos, status]
  )

  // キャッシュが空のときだけ fetch 中にスピナーを表示（useTodo と同じキャッシュ考慮型）
  const isPending = allTodos.length === 0 && isFetching

  return { todos, isPending, error }
}

/**
 * 特定の Todo を1件取得する hook
 *
 * isPending のセマンティクス（SWR の isLoading と同等）:
 *   共有キャッシュに同じ id の Todo があればスピナーなし（即座に表示）。
 *   fetch 完了後は最新データで共有キャッシュを UPSERT_TODO で更新する。
 *   → SWR/TanStack Query の「キャッシュがあれば即表示 + バックグラウンド再取得」と同じ体験
 *
 * ★ fetch 結果は必ず dispatch で共有キャッシュに書き込む。
 *   useState に入れてキャッシュを更新しない実装は NG
 *   （一覧に戻ったとき、更新が反映されない）
 */
export function useTodo(id: string | undefined) {
  const { todos } = useTodosState()
  const dispatch = useTodosDispatch()
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 共有キャッシュから検索（ヒットすれば即座に表示できる）
  const cachedTodo = useMemo(
    () => id ? todos.find(t => t.id === id) : undefined,
    [todos, id]
  )

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setIsFetching(true)
    setError(null)
    fakeFetch(`/api/todos/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not Found')
        const data: Todo = await res.json()
        if (!cancelled) {
          // ★ 共有キャッシュに反映（ここが vanilla との決定的な違い）
          dispatch({ type: 'UPSERT_TODO', payload: data })
        }
      })
      .catch((e: unknown) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setIsFetching(false) })
    return () => { cancelled = true }
  }, [id, dispatch])

  // キャッシュにあればスピナーなし。キャッシュになく fetch 中ならスピナー表示
  const isPending = !cachedTodo && isFetching

  return { todo: cachedTodo, isPending, error }
}

/**
 * Todo を作成する hook
 *
 * vanilla との違い:
 *   作成成功後に UPSERT_TODO で共有キャッシュを即座に更新する。
 *   一覧ページに戻ったとき、キャッシュに新 Todo が既にあるため
 *   再 fetch 完了前でも新しい Todo が表示される。
 */
export function useCreateTodo() {
  const dispatch = useTodosDispatch()
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
        setError(message)
        throw new Error(message)
      }
      const created: Todo = await res.json()
      // 共有キャッシュに追加
      dispatch({ type: 'UPSERT_TODO', payload: created })
    } finally {
      setIsPending(false)
    }
  }

  return { create, isPending, error }
}

/**
 * Todo を更新する hook
 */
export function useUpdateTodo(id: string | undefined) {
  const dispatch = useTodosDispatch()
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
      const updated: Todo = await res.json()
      dispatch({ type: 'UPSERT_TODO', payload: updated })
    } catch (e) {
      setError(String(e))
      throw e
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
  const dispatch = useTodosDispatch()
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
      dispatch({ type: 'REMOVE_TODO', payload: { id } })
    } catch (e) {
      setError(String(e))
      throw e
    } finally {
      setIsPending(false)
    }
  }

  return { remove, isPending, error }
}
