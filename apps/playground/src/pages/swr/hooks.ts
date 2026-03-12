/**
 * SWR パターン — Vercel 製のデータフェッチライブラリ
 *
 * SWR の基本概念:
 *   - URL（文字列）をそのままキャッシュの「キー」として使う
 *   - 同じキーを useSWR で複数コンポーネントから呼んでも、リクエストは1回だけ飛ぶ（重複排除）
 *   - ウィンドウにフォーカスが戻ったとき・ネットワーク復帰時に自動で再検証（再フェッチ）する
 *   - vanilla パターンと比べて、ローディング/エラー状態の手動管理が不要になる
 *
 * 読み取りと書き込みの分離:
 *   - 読み取り → useSWR（コンポーネントマウント時に自動フェッチ）
 *   - 書き込み → useSWRMutation（trigger() を呼ぶまでフェッチしない）
 */

import useSWR, { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'
import type { Todo, TodoStatus } from '@server-state-playground/shared'
import { fakeFetch } from '@/lib/fake-fetch'

type MutationData = { title: string; description: string; status: TodoStatus }

/**
 * useSWRMutation に渡す fetcher 関数の型:
 *   第1引数: キー（URL）、第2引数: { arg } に trigger() に渡した引数が入る
 *
 * useSWRMutation('/api/todos', createFetcher) として登録し、
 * trigger(data) を呼ぶと createFetcher('/api/todos', { arg: data }) が実行される。
 */
async function createFetcher(url: string, { arg }: { arg: MutationData }) {
  const res = await fakeFetch(url, { method: 'POST', body: JSON.stringify(arg) })
  if (!res.ok) throw new Error(String((await res.json()).error ?? 'Failed to create'))
  return res.json()
}

async function updateFetcher(url: string, { arg }: { arg: MutationData }) {
  const res = await fakeFetch(url, { method: 'PUT', body: JSON.stringify(arg) })
  if (!res.ok) throw new Error(String((await res.json()).error ?? 'Failed to update'))
  return res.json()
}

// DELETE は本文なし。useSWRMutation の fetcher 規約に合わせて第2引数を受け取るが、使わない。
async function deleteFetcher(url: string, _opts: { arg: unknown }) {
  const res = await fakeFetch(url, { method: 'DELETE' })
  if (!res.ok) throw new Error(String((await res.json()).error ?? 'Failed to delete'))
}

/**
 * Todo 一覧を取得する hook
 *
 * Read 系は全てグローバル fetcher（App.tsx の SWRConfig）を利用する。
 *   - グローバル fetcher は res.ok チェックと JSON パースを担うので、ここではキーだけ渡せばよい
 *   - key: キャッシュキー兼 URL。status が変わると別キーになり、別キャッシュエントリが作られる
 *
 * isLoading と isValidating の使い分け:
 *   - isLoading: データ未取得 かつ フェッチ中（初回ロードのみ true。再検証中は false）
 *   - isValidating: あらゆるフェッチ中（初回 + 再検証・フォーカス時再取得）
 *   → ここでは isLoading を使い、初回ロード中のみスピナーを表示する
 *   （TanStack Query では isPending && isFetching が同等）
 *
 * vanilla との違い: useEffect と setState が不要。SWR がキャッシュを管理してくれる。
 */
export function useTodos(status: TodoStatus | null) {
  const url = status ? `/api/todos?status=${status}` : '/api/todos'
  const { data, isLoading, error } = useSWR<Todo[]>(url) // グローバル fetcher を使用
  return {
    todos: data ?? [],
    isPending: isLoading,
    error: error ? String(error) : null,
  }
}

/**
 * 特定の Todo を1件取得する hook
 *
 * useTodos と同様にグローバル fetcher を使用。
 * useSWR の第1引数に null を渡すとフェッチを停止できる（条件付きフェッチ）。
 * id がまだない（undefined）場合は null にして fetch をスキップする。
 * vanilla では useEffect 内の if で制御していたことが、キー=null で宣言的に書ける。
 */
export function useTodo(id: string | undefined) {
  const { data, isLoading, error } = useSWR<Todo>(
    id ? `/api/todos/${id}` : null, // null でフェッチ停止。グローバル fetcher が res.ok チェック済み
  )
  return {
    todo: data,
    isPending: isLoading,
    error: error ? String(error) : null,
  }
}

/**
 * Todo を作成する hook
 *
 * useSWRMutation(key, fetcher)
 *   - trigger(arg) を呼んで初めてリクエストが飛ぶ（マウント時に自動実行されない）
 *   - isMutating: リクエスト実行中か
 *
 * ミューテーション後のキャッシュ更新:
 *   useSWRConfig().mutate(keyFilter) で条件に一致するキャッシュを一括再検証（再フェッチ）できる。
 *   ここではキーが '/api/todos' で始まるものをすべて対象にすることで、
 *   フィルタ済み一覧（例: /api/todos?status=todo）も含めて更新する。
 *
 *   mutate(filter) はキャッシュデータを保持したまま裏で再取得する（stale-while-revalidate）。
 *   TanStack Query の invalidateQueries と同じ挙動。
 *   ※ mutate(filter, undefined, { revalidate: true }) とすると
 *     キャッシュが即座にクリアされ isLoading=true（スピナー表示）になるので注意。
 */
export function useCreateTodo() {
  const { mutate } = useSWRConfig()
  const { trigger, isMutating, error } = useSWRMutation('/api/todos', createFetcher)

  const create = async (data: MutationData) => {
    await trigger(data) // POST リクエストを実行
    // '/api/todos' で始まる全キャッシュ（一覧・フィルタ済み一覧）を再検証
    mutate(key => typeof key === 'string' && key.startsWith('/api/todos'))
  }

  return { create, isPending: isMutating, error: error ? String(error) : null }
}

/**
 * Todo を更新する hook
 *
 * useCreateTodo と同じパターン。
 * キー `/api/todos/${id}` でキャッシュが登録されるため、更新後は同プレフィックスで再検証する。
 */
export function useUpdateTodo(id: string | undefined) {
  const { mutate } = useSWRConfig()
  const { trigger, isMutating, error } = useSWRMutation(`/api/todos/${id}`, updateFetcher)

  const update = async (data: MutationData) => {
    if (!id) throw new Error('id is required')
    await trigger(data)
    mutate(key => typeof key === 'string' && key.startsWith('/api/todos'))
  }

  return { update, isPending: isMutating, error: error ? String(error) : null }
}

/**
 * Todo を削除する hook
 */
export function useDeleteTodo(id: string | undefined) {
  const { mutate } = useSWRConfig()
  const { trigger, isMutating, error } = useSWRMutation(`/api/todos/${id}`, deleteFetcher)

  const remove = async () => {
    if (!id) throw new Error('id is required')
    await trigger() // 引数なしで DELETE リクエストを実行
    mutate(key => typeof key === 'string' && key.startsWith('/api/todos'))
  }

  return { remove, isPending: isMutating, error: error ? String(error) : null }
}
