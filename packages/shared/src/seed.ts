import type { Todo } from './types'

export const SEED_TODOS: Todo[] = [
  {
    id: 'seed-1',
    title: 'プロジェクトのセットアップ',
    description: '開発環境を構築し、必要なパッケージをインストールする',
    status: 'done',
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-02T10:00:00.000Z',
  },
  {
    id: 'seed-2',
    title: 'APIエンドポイントの設計',
    description: 'RESTful APIのエンドポイントを設計し、ドキュメントを作成する',
    status: 'in_progress',
    createdAt: '2026-03-03T09:00:00.000Z',
    updatedAt: '2026-03-05T14:00:00.000Z',
  },
  {
    id: 'seed-3',
    title: 'ユーザー認証の実装',
    description: 'JWT認証を使ったログイン・ログアウト機能を実装する',
    status: 'todo',
    createdAt: '2026-03-05T09:00:00.000Z',
    updatedAt: '2026-03-05T09:00:00.000Z',
  },
  {
    id: 'seed-4',
    title: 'テストの作成',
    description: 'ユニットテストとE2Eテストを作成する',
    status: 'todo',
    createdAt: '2026-03-06T09:00:00.000Z',
    updatedAt: '2026-03-06T09:00:00.000Z',
  },
]
