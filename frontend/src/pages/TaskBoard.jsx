import { useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { taskService } from '../services/taskService'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/PageHeader'
import { PriorityBadge } from '../components/StatusBadge'
import { TASK_STATUSES, formatDate, initials, isOverdue, toneFillClass } from '../lib/labels'
import { cn } from '../lib/utils'

// Left accent on each card shows priority at a glance.
const priorityAccent = {
  low: 'border-l-muted-foreground/30',
  medium: 'border-l-info',
  high: 'border-l-warning',
  urgent: 'border-l-danger',
}

const TaskCard = ({ task, currentUser }) => {
  const overdue = isOverdue(task)
  // The my-tasks endpoint omits the assignee object; those tasks belong to the current user.
  const assignee = task.assignee || (task.assignedTo && task.assignedTo === currentUser?.id ? currentUser : null)
  return (
    <div className={cn('rounded-md border border-l-[3px] bg-card p-3 shadow-xs transition-shadow hover:shadow-sm', priorityAccent[task.priority])}>
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      {task.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <PriorityBadge priority={task.priority} className="px-1.5 text-[10px]" />
          {task.dueDate && (
            <span className={cn('tabular flex items-center gap-1 text-[11px]', overdue ? 'font-medium text-danger' : 'text-muted-foreground')}>
              <CalendarDays className="h-3 w-3" />
              {formatDate(task.dueDate, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        {assignee ? (
          <span
            title={`${assignee.firstName} ${assignee.lastName}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
          >
            {initials(assignee.firstName, assignee.lastName)}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Unassigned</span>
        )}
      </div>
    </div>
  )
}

const TaskBoard = () => {
  const { user } = useAuth()
  const isStaff = user?.role === 'staff'

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => isStaff ? taskService.getMyTasks() : taskService.getAll()
  })

  const tasks = data?.data || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Board"
        description={isStaff ? 'Your assigned tasks, grouped by status.' : 'All tasks in your organization, grouped by status.'}
        actions={
          <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
            <span className="font-medium">Priority</span>
            {[['Low', 'bg-muted-foreground/30'], ['Medium', 'bg-info'], ['High', 'bg-warning'], ['Urgent', 'bg-danger']].map(([label, cls]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={cn('h-2.5 w-0.5 rounded-full', cls)} />
                {label}
              </span>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status.value)
          return (
            <section key={status.value} className="flex flex-col rounded-lg border bg-muted/40">
              <header className="flex items-center justify-between border-b px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', toneFillClass[status.tone])} />
                  <h2 className="text-sm font-semibold">{status.label}</h2>
                </div>
                <span className="tabular rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
                  {isLoading ? '–' : columnTasks.length}
                </span>
              </header>

              <div className="flex min-h-[240px] flex-1 flex-col gap-2 p-2">
                {isLoading ? (
                  [1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-md bg-card" />)
                ) : columnTasks.length > 0 ? (
                  columnTasks.map((task) => <TaskCard key={task.id} task={task} currentUser={user} />)
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-6 text-xs text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default TaskBoard
