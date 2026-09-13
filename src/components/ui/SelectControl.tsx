import { forwardRef, type SelectHTMLAttributes } from 'react'

export const SelectControl = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function SelectControl({ className, ...props }, ref) {
  return <select ref={ref} {...props} className={className} />
})

SelectControl.displayName = 'SelectControl'
