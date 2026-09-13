import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger' | 'unstyled'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'primary-action',
  secondary: 'secondary-action',
  text: 'text-action',
  danger: 'text-action danger-action',
  unstyled: '',
}

export function Button({ variant = 'secondary', className, ...props }: ButtonProps) {
  const classes = [variantClasses[variant], className].filter(Boolean).join(' ')
  return <button {...props} className={classes || undefined} />
}
