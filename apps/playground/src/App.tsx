import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router'
import { SWRConfig } from 'swr'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { QueryFunction } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { fakeFetch } from './lib/fake-fetch'
import { Home } from './pages/Home'
import { TodoList as VanillaList } from './pages/vanilla/TodoList'
import { TodoNew as VanillaNew } from './pages/vanilla/TodoNew'
import { TodoDetail as VanillaDetail } from './pages/vanilla/TodoDetail'
import { TodoList as SwrList } from './pages/swr/TodoList'
import { TodoNew as SwrNew } from './pages/swr/TodoNew'
import { TodoDetail as SwrDetail } from './pages/swr/TodoDetail'
import { TodoList as TanstackList } from './pages/tanstack/TodoList'
import { TodoNew as TanstackNew } from './pages/tanstack/TodoNew'
import { TodoDetail as TanstackDetail } from './pages/tanstack/TodoDetail'
import { TodoList as ReducerList } from './pages/reducer/TodoList'
import { TodoNew as ReducerNew } from './pages/reducer/TodoNew'
import { TodoDetail as ReducerDetail } from './pages/reducer/TodoDetail'
import { TodosProvider } from './pages/reducer/context'

/**
 * TanStack Query のグローバル queryFn（SWR のグローバル fetcher に相当）
 *
 * SWR との違い:
 *   SWR はキー = URL として fetcher に渡す設計。
 *   TanStack Query はキーと fetcher が概念上独立しており、queryKey は任意の配列でよい。
 *   ここでは URL ベースのキー設計を採用し、queryKey[0] をそのまま URL として使うことで
 *   グローバル queryFn を実現している（TanStack Query 公式ドキュメントのパターン）。
 */
const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const url = queryKey[0] as string
  const res = await fakeFetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

/**
 * TanStack Query の QueryClient 設定
 *
 * staleTime: 0（デフォルト）
 *   データは取得直後に「stale（古い）」扱いになり、マウント・フォーカス復帰・ネットワーク復帰時に
 *   バックグラウンドで再取得が走る。SWR の stale-while-revalidate と同じ思想。
 *   → 0 のままにすることで SWR と同じ「常に再検証」の動作に揃える
 *
 * gcTime: 300_000（5分、デフォルト）
 *   キャッシュがどのコンポーネントからも参照されなくなってからメモリに保持する時間。
 *   この間に同じキーの useQuery がマウントされると、キャッシュを即座に表示しつつ再取得する。
 *
 * retry: 3（デフォルト）
 *   失敗時に最大3回リトライ（指数バックオフ: 1s → 2s → 4s、上限30s）。
 *   SWR 側の errorRetryCount: 3 と回数を揃えている。
 *   404 はリソースが存在しないことが確定しているためリトライしない。
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        // 404 はリソースが存在しない → リトライしても結果は変わらない
        if (error instanceof Error && error.message.includes('404')) return false
        return failureCount < 3
      },
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/**
        * SWR のグローバル設定
        *
        * fetcher: グローバル fetcher。全 useSWR で共有され、キー（URL）を受け取って fetch + JSON パースする。
        *
        * dedupingInterval: 2000（2秒、デフォルト）
        *   同じキーの useSWR が短時間に複数回呼ばれたとき、リクエストを1回にまとめる時間窓。
        *   TanStack Query の staleTime: 0 + キャッシュ共有と同様の効果。
        *
        * errorRetryCount: 3
        *   失敗時の最大リトライ回数。SWR のデフォルトは無制限だが、
        *   TanStack Query のデフォルト（3回）に揃えて無限リトライを防ぐ。
        *
        * onErrorRetry: 404 でリトライしない
        *   リソースが存在しない場合、リトライしても結果は変わらないためスキップ。
        *   TanStack Query 側の retry 関数と同じポリシー。
        *
        * revalidateOnFocus / revalidateOnReconnect: true（デフォルト）
        *   ウィンドウフォーカス復帰・ネットワーク復帰時に自動で再検証する。
        *   TanStack Query の refetchOnWindowFocus / refetchOnReconnect と同等。
        */}
      <SWRConfig value={{
        fetcher: (url: string) => fakeFetch(url).then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch')
          return res.json()
        }),
        dedupingInterval: 2000,
        errorRetryCount: 3,
        onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
          // 404 はリソースが存在しない → リトライしない
          if (error instanceof Error && error.message.includes('404')) return
          if (retryCount >= 3) return
          setTimeout(() => revalidate({ retryCount }), Math.min(1000 * 2 ** retryCount, 30000))
        },
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
      }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vanilla" element={<VanillaList />} />
            <Route path="/vanilla/new" element={<VanillaNew />} />
            <Route path="/vanilla/:id" element={<VanillaDetail />} />
            <Route path="/swr" element={<SwrList />} />
            <Route path="/swr/new" element={<SwrNew />} />
            <Route path="/swr/:id" element={<SwrDetail />} />
            <Route path="/tanstack" element={<TanstackList />} />
            <Route path="/tanstack/new" element={<TanstackNew />} />
            <Route path="/tanstack/:id" element={<TanstackDetail />} />
            <Route element={<TodosProvider><Outlet /></TodosProvider>}>
              <Route path="/reducer" element={<ReducerList />} />
              <Route path="/reducer/new" element={<ReducerNew />} />
              <Route path="/reducer/:id" element={<ReducerDetail />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SWRConfig>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
