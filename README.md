# Server State Playground

サーバー状態管理ライブラリの比較プロジェクト。
同じ Todo CRUD を 3 つのパターンで実装し、コードの差分からライブラリの特性を体感する。

## Playground（メイン）

1 つの Vite アプリ内で、パスごとにライブラリを切り替える。
バックエンドなし — localStorage をバックエンドに見立てた模擬 fetch 関数で動作する。

| パス | 状態管理 | 特徴 |
|------|---------|------|
| `/vanilla` | なし（useState + useEffect） | 手動でローディング・エラー・再取得を管理 |
| `/swr` | [SWR](https://swr.vercel.app/) | URL ベースのキャッシュキー、自動再検証 |
| `/tanstack` | [TanStack Query](https://tanstack.com/query) | queryKey ベースのキャッシュ、DevTools 付き |

### 起動

```bash
pnpm install
pnpm build:shared     # 共有パッケージのビルド（初回のみ）
pnpm dev:vanilla      # http://localhost:5173
```

### 見るポイント

3 パターンの差分は `src/pages/` 配下のみ。fake-fetch・ルーティング・UI 構造は共通。

```
apps/playground/src/
├── lib/fake-fetch.ts          # 共通：localStorage 模擬 API
├── pages/
│   ├── vanilla/               # useState + useEffect
│   ├── swr/                   # useSWR + useSWRMutation
│   └── tanstack/              # useQuery + useMutation
└── App.tsx                    # SWRConfig + QueryClientProvider + ルーティング
```

各ディレクトリの `TodoList.tsx` / `TodoNew.tsx` / `TodoDetail.tsx` を並べて読むと、
状態管理部分だけが異なることがわかる。

## フレームワーク統合サンプル（参考）

ライブラリ作成元が想定するフレームワークとの統合パターンも参照用に残してある。

| ディレクトリ | 構成 | 起動 |
|---|---|---|
| `apps/nextjs-swr` | Next.js App Router + SWR | `pnpm dev:swr` (port 3000) |
| `apps/tanstack-start` | TanStack Start + TanStack Query | `pnpm dev:tanstack` (port 3001) |

## 技術スタック

| | Playground | nextjs-swr | tanstack-start |
|---|---|---|---|
| ランタイム | Vite + React 19 | Next.js 16 | TanStack Start (RC) |
| ルーティング | React Router v7 | App Router | TanStack Router |
| スタイリング | Tailwind CSS v4 | Tailwind CSS v4 | Tailwind CSS v4 |
| データ | localStorage | インメモリ | インメモリ |

## モデル

```typescript
type Todo = {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  createdAt: string
  updatedAt: string
}
```

## プロジェクト構成

```
server-state-playground/
├── packages/shared/       # 型定義・Zod スキーマ・シードデータ
├── apps/
│   ├── playground/        # メイン比較アプリ（Vite）
│   ├── nextjs-swr/        # 参考：Next.js + SWR
│   └── tanstack-start/    # 参考：TanStack Start + Query
├── package.json           # pnpm workspace ルート
└── pnpm-workspace.yaml
```

## 前提

- Node.js v22
- pnpm（`corepack enable` で有効化。`package.json` の `packageManager` フィールドに基づき適切なバージョンが自動で使われる）
