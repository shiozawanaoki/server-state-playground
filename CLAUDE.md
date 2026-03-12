# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

サーバー状態管理ライブラリの比較プロジェクト。同じ Todo CRUD を3パターン（vanilla useState、SWR、TanStack Query）で実装し、差分からライブラリ特性を体感する。

## コマンド

```bash
pnpm install
pnpm build:shared          # 共有パッケージのビルド（初回・shared変更時に必要）
pnpm dev:vanilla            # メイン比較アプリ http://localhost:5173
pnpm dev:swr                # Next.js + SWR http://localhost:3000
pnpm dev:tanstack           # TanStack Start http://localhost:3001
pnpm dev                    # 上記3つを並列起動

# 個別アプリのlint/build
pnpm --filter playground lint
pnpm --filter playground build
pnpm --filter nextjs-swr build
pnpm --filter tanstack-start build
```

## アーキテクチャ

pnpm workspace モノレポ。Node.js v22。

### packages/shared (`@server-state-playground/shared`)
全アプリ共通の型定義（`Todo`, `TodoStatus`）、Zodバリデーションスキーマ、シードデータ。tsupでビルド。**sharedを変更したら`pnpm build:shared`が必要。**

### apps/playground（メイン）
Vite + React 19 + React Router v7。1つのアプリ内でパスごとにライブラリを切り替える。バックエンドなし（localStorageを模擬fetchで操作）。

- `src/lib/fake-fetch.ts` — localStorage模擬API（全パターン共通）
- `src/pages/{vanilla,swr,tanstack}/` — 各ライブラリの実装。`TodoList.tsx` / `TodoNew.tsx` / `TodoDetail.tsx` + `hooks.ts`
- `src/components/` — 共通UIコンポーネント（shadcn/ui）。`TodoListView`, `TodoDetailView`, `TodoNewView`は表示専用で、状態管理ロジックはpages側
- `src/App.tsx` — SWRConfig + QueryClientProvider + ルーティング。グローバルfetcher/queryFnをここで設定

### apps/nextjs-swr（参考）
Next.js 16 App Router + SWR。Route Handlers (`src/app/api/todos/`) でインメモリCRUD。

### apps/tanstack-start（参考）
TanStack Start (RC) + TanStack Query + TanStack Router。Server Functions (`src/server/todos.ts`) でインメモリCRUD。

## 設計上のポイント

- 3パターンの差分は `src/pages/` 配下のみに集約。fake-fetch・ルーティング・UIは共通化済み
- playgroundのUIコンポーネントは表示責務のみ。データ取得・ミューテーションのロジックは各pagesディレクトリの `hooks.ts` に分離
- スタイリングは全アプリ Tailwind CSS v4
