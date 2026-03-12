import type { Todo } from '@server-state-playground/shared'
import { SEED_TODOS } from '@server-state-playground/shared'
import { nanoid } from 'nanoid'

const store = new Map<string, Todo>(SEED_TODOS.map((todo) => [todo.id, todo]))

export const todoStore = {
  getAll(status?: string): Todo[] {
    const todos = Array.from(store.values())
    if (status) {
      return todos.filter((t) => t.status === status)
    }
    return todos
  },

  getById(id: string): Todo | undefined {
    return store.get(id)
  },

  create(input: { title: string; description?: string; status?: string }): Todo {
    const now = new Date().toISOString()
    const todo: Todo = {
      id: nanoid(),
      title: input.title,
      description: input.description ?? '',
      status: (input.status as Todo['status']) ?? 'todo',
      createdAt: now,
      updatedAt: now,
    }
    store.set(todo.id, todo)
    return todo
  },

  update(
    id: string,
    input: { title?: string; description?: string; status?: string },
  ): Todo | undefined {
    const todo = store.get(id)
    if (!todo) return undefined

    const updated: Todo = {
      ...todo,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status as Todo['status'] }),
      updatedAt: new Date().toISOString(),
    }
    store.set(id, updated)
    return updated
  },

  delete(id: string): boolean {
    return store.delete(id)
  },
}
