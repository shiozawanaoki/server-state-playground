import { z } from 'zod'

export const todoStatusSchema = z.enum(['todo', 'in_progress', 'done'])

export const createTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  status: todoStatusSchema.optional().default('todo'),
})

export const updateTodoSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: todoStatusSchema.optional(),
})
