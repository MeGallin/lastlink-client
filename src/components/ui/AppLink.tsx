import type { AnchorHTMLAttributes } from 'react'

export type AppLinkVariant = 'default' | 'primary' | 'about'

interface AppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: AppLinkVariant
}

const variantClasses: Record<AppLinkVariant, string> = {
  default: '',
  primary: 'primary-action-link',
  about: 'how-to-use-dialog__about',
}

export function AppLink({ variant = 'default', className, ...props }: AppLinkProps) {
  const classes = [variantClasses[variant], className].filter(Boolean).join(' ')
  return <a {...props} className={classes || undefined} />
}
