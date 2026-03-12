import { Link } from 'react-router'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'

export function Home() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <PageBreadcrumb items={[{ label: 'Home' }]} />
      <h1 className="text-2xl font-bold mb-2">Server State Playground</h1>
      <p className="text-muted-foreground mb-8">同じTodo CRUDを4つの状態管理パターンで実装した比較サンプル</p>

      <ul className="space-y-3">
        <li>
          <Link to="/vanilla" className="block p-4 border rounded hover:bg-accent">
            <div className="font-medium">useState + useEffect</div>
            <div className="text-sm text-muted-foreground mt-1">ライブラリなし。useEffectで手動フェッチ・手動state管理</div>
          </Link>
        </li>
        <li>
          <Link to="/reducer" className="block p-4 border rounded hover:bg-accent">
            <div className="font-medium">useReducer + useEffect</div>
            <div className="text-sm text-muted-foreground mt-1">ライブラリなし。reducerで状態遷移を一括管理し不整合を防ぐ</div>
          </Link>
        </li>
        <li>
          <Link to="/swr" className="block p-4 border rounded hover:bg-accent">
            <div className="font-medium">SWR</div>
            <div className="text-sm text-muted-foreground mt-1">Vercel製。キャッシュ・再検証・フォーカス時再取得</div>
          </Link>
        </li>
        <li>
          <Link to="/tanstack" className="block p-4 border rounded hover:bg-accent">
            <div className="font-medium">TanStack Query</div>
            <div className="text-sm text-muted-foreground mt-1">QueryClient・invalidation・devtools付き</div>
          </Link>
        </li>
      </ul>
    </div>
  )
}
