import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type z } from 'zod'
import { Plus, Save, Trash2, Circle, Clock, CircleCheck } from 'lucide-react'
import { createTodoSchema, todoStatusSchema } from '@server-state-playground/shared'
import type { TodoStatus } from '@server-state-playground/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type FormInput = z.input<typeof createTodoSchema>
export type TodoFormValues = z.output<typeof createTodoSchema>

const STATUS_OPTIONS: ReadonlyArray<{ value: TodoStatus; label: string; icon: React.ReactNode }> = [
  { value: 'todo', label: 'Todo', icon: <Circle className="size-3.5" /> },
  { value: 'in_progress', label: '進行中', icon: <Clock className="size-3.5" /> },
  { value: 'done', label: '完了', icon: <CircleCheck className="size-3.5" /> },
]

export interface TodoFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<TodoFormValues>
  onSubmit: (data: TodoFormValues) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
  isPending: boolean
  serverError: string | null
  submitLabel: string
  pendingLabel: string
}

export function TodoForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  onDelete,
  isPending,
  serverError,
  submitLabel,
  pendingLabel,
}: TodoFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormInput, undefined, TodoFormValues>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      status: defaultValues?.status ?? 'todo',
    },
  })

  const SubmitIcon = mode === 'create' ? Plus : Save

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">タイトル *</Label>
        <Input id="title" {...register('title')} />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">説明</Label>
        <Textarea id="description" rows={3} {...register('description')} />
        {errors.description && (
          <p className="text-destructive text-sm">{errors.description.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>ステータス</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  const parsed = todoStatusSchema.safeParse(v)
                  if (parsed.success) field.onChange(parsed.data)
                }}
              >
                {/* SelectValue を使うことで Radix の item-aligned ポジショニングが正しく動作する */}
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(({ value, label, icon }) => (
                    <SelectItem key={value} value={value}>
                      <span className="flex items-center gap-1.5">
                        {icon}
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
        />
      </div>
      {serverError && <p className="text-destructive text-sm">{serverError}</p>}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? pendingLabel : <><SubmitIcon className="size-4" />{submitLabel}</>}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        </div>
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending}>
            <Trash2 className="size-4" />
            削除
          </Button>
        )}
      </div>
    </form>
  )
}
