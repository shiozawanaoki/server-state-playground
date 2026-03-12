import { NextRequest, NextResponse } from 'next/server'
import { updateTodoSchema } from '@server-state-playground/shared'
import { getTodo, updateTodo, deleteTodo } from '@/lib/store'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const todo = getTodo(id)
  if (!todo) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(todo)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const result = updateTodoSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  const todo = updateTodo(id, result.data)
  if (!todo) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(todo)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const deleted = deleteTodo(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
