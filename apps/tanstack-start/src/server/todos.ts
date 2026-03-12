import { createServerFn } from '@tanstack/react-start'
import { todoStore } from '../lib/store'
import { createTodoSchema, updateTodoSchema } from '@server-state-playground/shared'

export const getTodos = createServerFn({ method: 'GET' })
  .inputValidator((data: { status?: string }) => data)
  .handler(({ data }) => {
    return todoStore.getAll(data?.status)
  })

export const getTodo = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(({ data }) => {
    const todo = todoStore.getById(data.id)
    if (!todo) throw new Error(`Todo not found: ${data.id}`)
    return todo
  })

export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createTodoSchema.parse(data))
  .handler(({ data }) => {
    return todoStore.create(data)
  })

export const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as { id: string } & Record<string, unknown>
    const updates = updateTodoSchema.parse(d)
    return { id: d.id, ...updates }
  })
  .handler(({ data }) => {
    const { id, ...input } = data
    const todo = todoStore.update(id, input)
    if (!todo) throw new Error(`Todo not found: ${id}`)
    return todo
  })

export const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(({ data }) => {
    const deleted = todoStore.delete(data.id)
    if (!deleted) throw new Error(`Todo not found: ${data.id}`)
    return { success: true }
  })
