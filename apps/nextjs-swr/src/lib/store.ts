import { nanoid } from 'nanoid'
import { SEED_TODOS, type Todo, type TodoStatus, type CreateTodoInput, type UpdateTodoInput } from '@server-state-playground/shared'

const store = new Map<string, Todo>(SEED_TODOS.map(todo => [todo.id, todo]))

export function getAllTodos(status?: TodoStatus): Todo[] {
  const todos = Array.from(store.values())
  if (status) {
    return todos.filter(todo => todo.status === status)
  }
  return todos
}

export function getTodo(id: string): Todo | undefined {
  return store.get(id)
}

export function createTodo(input: CreateTodoInput): Todo {
  const now = new Date().toISOString()
  const todo: Todo = {
    id: nanoid(),
    title: input.title,
    description: input.description ?? '',
    status: input.status ?? 'todo',
    createdAt: now,
    updatedAt: now,
  }
  store.set(todo.id, todo)
  return todo
}

export function updateTodo(id: string, input: UpdateTodoInput): Todo | undefined {
  const existing = store.get(id)
  if (!existing) return undefined

  const updated: Todo = {
    ...existing,
    ...Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)),
    updatedAt: new Date().toISOString(),
  }
  store.set(id, updated)
  return updated
}

export function deleteTodo(id: string): boolean {
  return store.delete(id)
}
