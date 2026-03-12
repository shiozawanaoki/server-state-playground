import { NextRequest, NextResponse } from 'next/server'
import { createTodoSchema } from '@server-state-playground/shared'
import { getAllTodos, createTodo } from '@/lib/store'
import type { TodoStatus } from '@server-state-playground/shared'

export function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') as TodoStatus | null
  const todos = getAllTodos(status ?? undefined)
  return NextResponse.json(todos)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = createTodoSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  const todo = createTodo(result.data)
  return NextResponse.json(todo, { status: 201 })
}
