import { forwardRef, type InputHTMLAttributes } from 'react'

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} {...props} className={className} />
  },
)

TextInput.displayName = 'TextInput'
