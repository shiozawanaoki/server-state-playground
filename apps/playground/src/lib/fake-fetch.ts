import { nanoid } from 'nanoid'
import {
  type Todo,
  SEED_TODOS,
  createTodoSchema,
  updateTodoSchema,
} from '@server-state-playground/shared'

const STORAGE_KEY = 'vite-vanilla-todos'
const DELAY_MS = 750

function loadTodos(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) {
    const initial = SEED_TODOS
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }
  return JSON.parse(raw)
}

function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function makeResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function fakeFetch(
  input: string,
  init?: { method?: string; body?: string },
): Promise<Response> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS))

  const url = new URL(input, 'http://localhost')
  const method = (init?.method ?? 'GET').toUpperCase()
  const pathname = url.pathname
  const rawStatus = url.searchParams.get('status')
  const statusFilter = rawStatus && ['todo', 'in_progress', 'done'].includes(rawStatus) ? rawStatus : null

  // GET /api/todos
  if (method === 'GET' && pathname === '/api/todos') {
    let todos = loadTodos()
    if (statusFilter) {
      todos = todos.filter((t) => t.status === statusFilter)
    }
    return makeResponse(todos)
  }

  // POST /api/todos
  if (method === 'POST' && pathname === '/api/todos') {
    const parsed = createTodoSchema.safeParse(JSON.parse(init?.body ?? '{}'))
    if (!parsed.success) {
      return makeResponse({ error: parsed.error.message }, 400)
    }
    const now = new Date().toISOString()
    const newTodo: Todo = {
      id: nanoid(),
      title: parsed.data.title,
      description: parsed.data.description ?? '',
      status: parsed.data.status ?? 'todo',
      createdAt: now,
      updatedAt: now,
    }
    const todos = loadTodos()
    saveTodos([...todos, newTodo])
    return makeResponse(newTodo, 201)
  }

  // /api/todos/:id
  const match = pathname.match(/^\/api\/todos\/([^/]+)$/)
  if (match) {
    const id = match[1]

    if (method === 'GET') {
      const todos = loadTodos()
      const todo = todos.find((t) => t.id === id)
      if (!todo) return makeResponse({ error: 'Not Found' }, 404)
      return makeResponse(todo)
    }

    if (method === 'PUT') {
      const parsed = updateTodoSchema.safeParse(JSON.parse(init?.body ?? '{}'))
      if (!parsed.success) {
        return makeResponse({ error: parsed.error.message }, 400)
      }
      const todos = loadTodos()
      const idx = todos.findIndex((t) => t.id === id)
      if (idx === -1) return makeResponse({ error: 'Not Found' }, 404)
      const updated: Todo = {
        ...todos[idx],
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      }
      todos[idx] = updated
      saveTodos(todos)
      return makeResponse(updated)
    }

    if (method === 'DELETE') {
      const todos = loadTodos()
      const idx = todos.findIndex((t) => t.id === id)
      if (idx === -1) return makeResponse({ error: 'Not Found' }, 404)
      todos.splice(idx, 1)
      saveTodos(todos)
      return makeResponse({ success: true })
    }
  }

  return makeResponse({ error: 'Not Found' }, 404)
}
