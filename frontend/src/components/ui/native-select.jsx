import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A styled native <select>. Works with react-hook-form's register() and
 * follows the light/dark theme, unlike an unstyled browser select.
 */
const NativeSelect = React.forwardRef(({ className, wrapperClassName, children, ...props }, ref) => (
  <div className={cn("relative", wrapperClassName)}>
    <select
      ref={ref}
      className={cn(
        "h-9 w-full cursor-pointer appearance-none rounded-md border border-input bg-card pl-3 pr-9 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}>
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>
))
NativeSelect.displayName = "NativeSelect"

export { NativeSelect }
