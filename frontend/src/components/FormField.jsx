import { Label } from './ui/label'
import { cn } from '../lib/utils'

/** Label + control + validation message, spaced consistently in forms. */
const FormField = ({ id, label, hint, error, className, children }) => (
  <div className={cn('space-y-1.5', className)}>
    <Label htmlFor={id} className="text-xs font-medium">
      {label}
      {hint && <span className="ml-1 font-normal text-muted-foreground">{hint}</span>}
    </Label>
    {children}
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
)

export default FormField
