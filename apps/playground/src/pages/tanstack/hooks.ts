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
 *
 * enabled オプション:
 *   enabled: false のときはフェッチを実行しない。isPending は true（データなし）だが
 *   isFetching は false（リクエストなし）になる。→ isPending && isFetching で正しく判定可能。
 *   SWR では useSWR(null) で同じことを実現していた（key=null でフェッチ停止）。
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
  // useQueryClient: QueryClient インスタンスを取得し、キャッシュを手動操作する
  // SWR では useSWRConfig() が同じ役割（mutate 関数の取得元）
  const queryClient = useQueryClient()
  const mutation = useMutation({
    // mutationFn: mutate() / mutateAsync() を呼んだときに実行される関数
    // SWR の useSWRMutation の fetcher に相当
    mutationFn: (data: MutationData) =>
      fakeFetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(String(body.error ?? 'Failed to create'))
        return body
      }),
    // onSuccess: mutationFn が成功した直後に実行されるコールバック
    // SWR では trigger() 後に手動で mutate(filter) を呼ぶが、
    // TanStack Query では onSuccess に書くことで宣言的にキャッシュ無効化できる
    onSuccess: () => queryClient.invalidateQueries({
      // predicate: 各キャッシュエントリ（Query オブジェクト）を受け取り、
      // true を返したものを「stale」にマーク → 自動で再フェッチが走る
      // queryKey は常に配列だが要素の型が不定のため typeof チェックが必要
      predicate: (query) =>
        typeof query.queryKey[0] === 'string' &&
        (query.queryKey[0] as string).startsWith('/api/todos'),
    }),
  })
  // mutateAsync: Promise を返す（await で完了を待てる）。mutate() は void で callback ベース
  const create = (data: MutationData) => mutation.mutateAsync(data).then(() => {})
  // mutation.isPending: mutationFn 実行中に true。SWR の isMutating に相当
  return { create, isPending: mutation.isPending, error: mutation.error?.message ?? null }
}

/**
 * Todo を更新する hook
 *
 * useCreateTodo と同じ useMutation + invalidateQueries パターン。
 * mutationFn 内で id を参照するため、id を hook の引数で受け取る。
 * SWR: useSWRMutation(`/api/todos/${id}`, updateFetcher) ではキーが URL になるが、
 * TanStack: useMutation はキーを持たない（invalidateQueries で一括無効化する設計）。
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
 * Todo を削除する hook
 *
 * useCreateTodo と同じ useMutation + invalidateQueries パターン。
 * DELETE はリクエストボディなし。mutationFn の引数も不要。
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
