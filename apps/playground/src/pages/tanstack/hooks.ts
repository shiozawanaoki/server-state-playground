/**
 * TanStack Query パターン — サーバー状態管理の定番ライブラリ
 *
 * TanStack Query の基本概念:
 *   - データは「queryKey（配列）」をキーとして QueryClient のキャッシュに保存される
 *   - queryKey が同じ useQuery は、コンポーネントをまたいでキャッシュを共有し、リクエストを重複させない
 *   - ミューテーション後は invalidateQueries で「このキーのキャッシュは古い」とマークすると
 *     自動で再フェッチが走る → vanilla の手動再フェッチ、SWR の mutate と同じ目的
 *
 * queryKey 設計:
 *   App.tsx の defaultQueryFn が queryKey[0] を URL として使用するため、
 *   URL そのものをキーの先頭に置く設計を採用している。
 *   SWR のキー = URL とほぼ同じ発想だが、TanStack Query ではキーと fetcher は概念上独立しており、
 *   配列の追加要素で粒度を調整できる（queryKey[1] 以降を使った名前空間分離等）。
 *
 * 読み取りと書き込みの分離:
 *   - 読み取り → useQuery（マウント時に自動フェッチ、queryFn は defaultQueryFn を使用）
 *   - 書き込み → useMutation（mutate/mutateAsync を呼ぶまで実行されない）
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Todo, TodoStatus } from '@server-state-playground/shared'
import { fakeFetch } from '@/lib/fake-fetch'

type MutationData = { title: string; description: string; status: TodoStatus }

/**
 * Todo 一覧を取得する hook
 *
 * queryFn を省略し、App.tsx の defaultQueryFn（queryKey[0] を URL として fetch）を利用する。
 *   - queryKey[0] がそのまま fetch URL になるため、status に応じたクエリ文字列をキーに含める
 *   - キーが変わると別キャッシュエントリになる（SWR と同様の挙動）
 *
 * isPending と isFetching の使い分け:
 *   - isPending: データ未取得（フェッチ中かは問わない。enabled:false でも true になる）
 *   - isFetching: あらゆるフェッチ中（初回 + バックグラウンド再取得）
 *   - isLoading（= isPending && isFetching）: データ未取得 かつ フェッチ中 → SWR の isLoading に相当
 *   → SWR と動作を揃えるため isPending && isFetching を返す
 */
export function useTodos(status: TodoStatus | null) {
  const url = status ? `/api/todos?status=${status}` : '/api/todos'
  const { data, isPending, isFetching, error } = useQuery<Todo[]>({
    queryKey: [url], // URL をキーにすることで defaultQueryFn が URL を受け取れる
  })
  return { todos: data ?? [], isPending: isPending && isFetching, error: error?.message ?? null }
}

/**
 * 特定の Todo を1件取得する hook
 *
 * useTodos と同様に queryFn を省略してグローバル defaultQueryFn を利用。
 * enabled: id !== undefined で、id が確定するまでフェッチを停止する（条件付きクエリ）。
 * SWR では useSWR(null) で同じことを実現していた。
 */
export function useTodo(id: string | undefined) {
  const { data, isPending, isFetching, error } = useQuery<Todo>({
    queryKey: [`/api/todos/${id}`], // id が undefined のときは enabled:false でフェッチしない
    enabled: id !== undefined,
  })
  return { todo: data, isPending: isPending && isFetching, error: error?.message ?? null }
}

/**
 * Todo を作成する hook
 *
 * useMutation({ mutationFn, onSuccess })
 *   - mutationFn: mutate/mutateAsync を呼ぶと実行されるリクエスト関数
 *   - onSuccess: 成功時のコールバック。ここでキャッシュの無効化を行う
 *
 * invalidateQueries の predicate:
 *   URL ベースのキー設計では queryKey[0] が '/api/todos' で始まるかをフィルタすることで
 *   一覧・詳細を含む全キャッシュを一括無効化できる。
 *   （配列プレフィックス一致ではなく文字列の前方一致で判定する点が SWR と同じ発想）
 *   SWR: mutate(key => key.startsWith('/api/todos'))
 *   TanStack: invalidateQueries({ predicate: q => q.queryKey[0].startsWith('/api/todos') })
 *
 * mutateAsync() は Promise を返すので await で完了を待てる。
 * .then(() => {}) で戻り値を void に変換し、呼び出し元の型を統一する。
 */
export function useCreateTodo() {
  const queryClient = useQueryClient() // QueryClient インスタンスを取得（キャッシュ操作に使う）
  const mutation = useMutation({
    mutationFn: (data: MutationData) =>
      fakeFetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(String(body.error ?? 'Failed to create'))
        return body
      }),
    onSuccess: () => queryClient.invalidateQueries({
      // queryKey[0]（URL）が '/api/todos' で始まる全クエリを無効化
      predicate: (query) =>
        typeof query.queryKey[0] === 'string' &&
        (query.queryKey[0] as string).startsWith('/api/todos'),
    }),
  })
  const create = (data: MutationData) => mutation.mutateAsync(data).then(() => {})
  return { create, isPending: mutation.isPending, error: mutation.error?.message ?? null }
}

/**
 * Todo を更新する hook（useCreateTodo と同じパターン）
 */
export function useUpdateTodo(id: string | undefined) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: MutationData) => {
      if (!id) throw new Error('id is required')
      return fakeFetch(`/api/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }).then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(String(body.error ?? 'Failed to update'))
        return body
      })
    },
    onSuccess: () => queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === 'string' &&
        (query.queryKey[0] as string).startsWith('/api/todos'),
    }),
  })
  const update = (data: MutationData) => mutation.mutateAsync(data).then(() => {})
  return { update, isPending: mutation.isPending, error: mutation.error?.message ?? null }
}

/**
 * Todo を削除する hook（useCreateTodo と同じパターン）
 */
export function useDeleteTodo(id: string | undefined) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('id is required')
      return fakeFetch(`/api/todos/${id}`, { method: 'DELETE' }).then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(String(body.error ?? 'Failed to delete'))
        return body
      })
    },
    onSuccess: () => queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === 'string' &&
        (query.queryKey[0] as string).startsWith('/api/todos'),
    }),
  })
  const remove = () => mutation.mutateAsync().then(() => {})
  return { remove, isPending: mutation.isPending, error: mutation.error?.message ?? null }
}
