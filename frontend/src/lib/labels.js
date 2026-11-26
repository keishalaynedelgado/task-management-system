// Display labels and badge tones for the app's enum values, kept in one
// place so every page shows statuses, priorities and roles the same way.

export const TASK_STATUSES = [
  { value: 'pending', label: 'Pending', tone: 'warning' },
  { value: 'in_progress', label: 'In Progress', tone: 'info' },
  { value: 'completed', label: 'Completed', tone: 'success' },
  { value: 'cancelled', label: 'Cancelled', tone: 'neutral' },
]

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', tone: 'neutral' },
  { value: 'medium', label: 'Medium', tone: 'info' },
  { value: 'high', label: 'High', tone: 'warning' },
  { value: 'urgent', label: 'Urgent', tone: 'danger' },
]

const USER_ROLES = [
  { value: 'super_admin', label: 'Super Admin', tone: 'primary' },
  { value: 'admin', label: 'Admin', tone: 'info' },
  { value: 'staff', label: 'Staff', tone: 'neutral' },
]

export const SUBSCRIPTION_PLANS = [
  { value: 'basic', label: 'Basic', tone: 'neutral' },
  { value: 'premium', label: 'Premium', tone: 'info' },
  { value: 'enterprise', label: 'Enterprise', tone: 'primary' },
]

// Solid fill for progress bars and legend dots, matching the badge tones.
export const toneFillClass = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  danger: 'bg-danger',
  neutral: 'bg-muted-foreground/40',
}

const find = (list, value) => list.find((item) => item.value === value)

const humanize = (value) =>
  String(value ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

export const statusMeta = (value) => find(TASK_STATUSES, value) || { value, label: humanize(value), tone: 'neutral' }
export const priorityMeta = (value) => find(TASK_PRIORITIES, value) || { value, label: humanize(value), tone: 'neutral' }
export const roleMeta = (value) => find(USER_ROLES, value) || { value, label: humanize(value), tone: 'neutral' }
export const planMeta = (value) => find(SUBSCRIPTION_PLANS, value) || { value, label: humanize(value), tone: 'neutral' }

export const formatRole = (value) => roleMeta(value).label

export const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, options)
}

export const isOverdue = (task) =>
  Boolean(task?.dueDate) &&
  !['completed', 'cancelled'].includes(task.status) &&
  new Date(task.dueDate) < new Date()

export const initials = (firstName = '', lastName = '') =>
  `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?'
