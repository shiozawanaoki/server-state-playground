export type TodoStatus = 'todo' | 'in_progress' | 'done'

export type Todo = {
  id: string
  title: string
  description: string
  status: TodoStatus
  createdAt: string
  updatedAt: string
}

export type CreateTodoInput = {
  title: string
  description?: string
  status?: TodoStatus
}

export type UpdateTodoInput = {
  title?: string
  description?: string
  status?: TodoStatus
}
