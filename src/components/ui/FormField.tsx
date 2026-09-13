import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  helpText?: string
  helpId?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, helpText, helpId, children }: FormFieldProps) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {helpText && <small id={helpId}>{helpText}</small>}
    </div>
  )
}
