import { Badge } from './ui/badge'
import { planMeta, priorityMeta, roleMeta, statusMeta } from '../lib/labels'

const Dot = () => <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />

export const StatusBadge = ({ status, className }) => {
  const meta = statusMeta(status)
  return (
    <Badge variant={meta.tone} className={className}>
      <Dot />
      {meta.label}
    </Badge>
  )
}

export const PriorityBadge = ({ priority, className }) => {
  const meta = priorityMeta(priority)
  return <Badge variant={meta.tone} className={className}>{meta.label}</Badge>
}

export const RoleBadge = ({ role, className }) => {
  const meta = roleMeta(role)
  return <Badge variant={meta.tone} className={className}>{meta.label}</Badge>
}

export const PlanBadge = ({ plan, className }) => {
  const meta = planMeta(plan)
  return <Badge variant={meta.tone} className={className}>{meta.label}</Badge>
}

export const ActiveBadge = ({ active, className }) => (
  <Badge variant={active ? 'success' : 'neutral'} className={className}>
    <Dot />
    {active ? 'Active' : 'Inactive'}
  </Badge>
)
