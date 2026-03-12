import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import type { Todo } from '@server-state-playground/shared'

// --- State ---

type TodosState = {
  todos: Todo[] // 共有キャッシュ。直近の一覧 fetch 結果 + 個別操作で追加・更新された Todo を保持
}

const initialState: TodosState = {
  todos: [],
}

// --- Actions ---

// アクション名は全て VERB_NOUN で統一
type TodosAction =
  | { type: 'SET_TODOS'; payload: Todo[] }             // 一覧 fetch 成功時: キャッシュ全体を置換
  | { type: 'UPSERT_TODO'; payload: Todo }              // 詳細 fetch・作成・更新成功時: 1件を挿入or更新
  | { type: 'REMOVE_TODO'; payload: { id: string } }   // 削除成功時: 1件を除去

// FETCH_START / FETCH_SUCCESS をアクションに含めない理由:
// reducer に fetch ライフサイクルを入れると、SWR/TanStack Query が内部で解決している問題
//（race condition, stale-while-revalidate, error retry）を独自に再実装することになる。
// このパターンの教育目的は「共有キャッシュを useReducer + Context で実現するとどうなるか」であり、
// fetch 制御は vanilla と同じく useState に任せる。

// --- Reducer ---

function todosReducer(state: TodosState, action: TodosAction): TodosState {
  switch (action.type) {
    case 'SET_TODOS':
      return { ...state, todos: action.payload }
    case 'UPSERT_TODO': {
      const idx = state.todos.findIndex(t => t.id === action.payload.id)
      if (idx === -1) {
        // 新規追加（create 後）
        return { ...state, todos: [...state.todos, action.payload] }
      }
      // 既存更新（update 後・詳細 fetch 後）
      const next = [...state.todos]
      next[idx] = action.payload
      return { ...state, todos: next }
    }
    case 'REMOVE_TODO':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload.id) }
    default:
      return state
  }
}

// --- Contexts ---

// State と Dispatch を分離することで、dispatch だけ使うコンポーネントが
// state 変更時に不要な再レンダリングを受けないようにする
const TodosStateContext = createContext<TodosState | null>(null)
const TodosDispatchContext = createContext<Dispatch<TodosAction> | null>(null)

// --- Provider ---

export function TodosProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(todosReducer, initialState)
  return (
    <TodosStateContext.Provider value={state}>
      <TodosDispatchContext.Provider value={dispatch}>
        {children}
      </TodosDispatchContext.Provider>
    </TodosStateContext.Provider>
  )
}

// --- Internal hooks（hooks.ts から使う） ---

export function useTodosState(): TodosState {
  const ctx = useContext(TodosStateContext)
  if (!ctx) throw new Error('useTodosState must be used within TodosProvider')
  return ctx
}

export function useTodosDispatch(): Dispatch<TodosAction> {
  const ctx = useContext(TodosDispatchContext)
  if (!ctx) throw new Error('useTodosDispatch must be used within TodosProvider')
  return ctx
}
