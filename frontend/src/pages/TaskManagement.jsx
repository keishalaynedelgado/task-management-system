import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService } from '../services/taskService'
import { userService } from '../services/userService'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { NativeSelect } from '../components/ui/native-select'
import PageHeader from '../components/PageHeader'
import FormField from '../components/FormField'
import EmptyState from '../components/EmptyState'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'
import { TASK_PRIORITIES, TASK_STATUSES, formatDate, initials, isOverdue } from '../lib/labels'
import { cn } from '../lib/utils'
import { Plus, Pencil, Trash2, Search, ClipboardList } from 'lucide-react'

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional(),
  // The "Unassigned" option submits an empty string; treat it as no assignee.
  assignedTo: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().uuid().optional())
})

const TaskManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const queryClient = useQueryClient()

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll()
  })

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', searchTerm, statusFilter],
    queryFn: () => taskService.getAll({
      search: searchTerm,
      status: statusFilter
    })
  })

  const createMutation = useMutation({
    mutationFn: taskService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      setIsDialogOpen(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => taskService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      setIsDialogOpen(false)
      setEditingTask(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
    }
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(taskSchema)
  })

  const onSubmit = (formData) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
    reset()
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    reset({
      ...task,
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(id)
    }
  }

  const tasks = data?.data || []
  const users = usersData?.data || []
  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Create, assign and track every task in your organization."
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTask(null); reset({ status: 'pending', priority: 'medium', assignedTo: '' }) }}>
                <Plus className="h-4 w-4" />
                New task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Edit task' : 'New task'}</DialogTitle>
                <DialogDescription>
                  {editingTask ? 'Update the task details below.' : 'Fill in the details to create a task.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField id="title" label="Title" error={errors.title?.message}>
                  <Input id="title" placeholder="e.g. Prepare quarterly report" aria-invalid={!!errors.title} {...register('title')} />
                </FormField>
                <FormField id="description" label="Description" hint="(optional)">
                  <Textarea id="description" placeholder="Add context, acceptance criteria or notes" {...register('description')} />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField id="status" label="Status">
                    <NativeSelect id="status" {...register('status')}>
                      {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </NativeSelect>
                  </FormField>
                  <FormField id="priority" label="Priority">
                    <NativeSelect id="priority" {...register('priority')}>
                      {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </NativeSelect>
                  </FormField>
                  <FormField id="dueDate" label="Due date">
                    <Input id="dueDate" type="date" {...register('dueDate')} />
                  </FormField>
                  <FormField id="assignedTo" label="Assignee" error={errors.assignedTo?.message}>
                    <NativeSelect id="assignedTo" {...register('assignedTo')}>
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {editingTask ? 'Save changes' : 'Create task'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <NativeSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              wrapperClassName="sm:w-44"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </NativeSelect>
          </div>
          <p className="tabular text-xs text-muted-foreground">
            {isLoading ? 'Loading...' : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks found"
            description={searchTerm || statusFilter ? 'Try a different search or filter.' : 'Create your first task to get started.'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[260px]">Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-muted-foreground">{task.description}</p>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={task.status} /></TableCell>
                  <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                          {initials(task.assignee.firstName, task.assignee.lastName)}
                        </span>
                        <span className="whitespace-nowrap">{task.assignee.firstName} {task.assignee.lastName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className={cn('tabular whitespace-nowrap', isOverdue(task) ? 'font-medium text-danger' : 'text-muted-foreground')}>
                    {formatDate(task.dueDate) || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(task)} title="Edit task">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(task.id)}
                        title="Delete task"
                        className="text-muted-foreground hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

export default TaskManagement
