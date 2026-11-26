import { Card } from './ui/card'
import { cn } from '../lib/utils'

const toneClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-muted text-muted-foreground',
}

/** KPI tile: label, large value, optional icon and supporting line. */
const StatCard = ({ label, value, icon: Icon, tone = 'neutral', footer, loading, className }) => (
  <Card className={cn('p-5', className)}>
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {Icon && (
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', toneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
    {loading ? (
      <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
    ) : (
      <p className="tabular mt-1 text-3xl font-semibold tracking-tight">{value}</p>
    )}
    {footer && <div className="mt-2 text-xs text-muted-foreground">{footer}</div>}
  </Card>
)

export default StatCard
