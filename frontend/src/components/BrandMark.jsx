import { Check } from 'lucide-react'
import { cn } from '../lib/utils'

/**
 * App logo tile. Uses fixed brand colours (not theme tokens) so the mark
 * looks the same in light mode, dark mode and on the navy login panel.
 */
const BrandMark = ({ className }) => (
  <div
    className={cn(
      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(222_68%_50%)] to-[hsl(205_85%_50%)] text-white shadow-md shadow-[hsl(222_68%_50%/0.3)] ring-1 ring-inset ring-white/20',
      className
    )}
  >
    <Check className="h-[18px] w-[18px]" strokeWidth={3} />
  </div>
)

export default BrandMark
