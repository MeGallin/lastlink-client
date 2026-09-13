type LastLinkLogoVariant = 'full' | 'wordmark'

interface LastLinkLogoProps {
  variant?: LastLinkLogoVariant
  href?: string
  className?: string
  onHome?: () => void
}

export function LastLinkLogo({
  variant = 'full',
  className,
  href = '#/',
  onHome,
}: LastLinkLogoProps) {
  const classes = ['lastlink-logo', `lastlink-logo--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  const wordmark = (
    <span className="lastlink-logo__wordmark">
      <span>last</span>
      <span>link</span>
    </span>
  )

  if (variant === 'wordmark') {
    return <span className={classes}>{wordmark}</span>
  }

  return (
    <a className={classes} href={href} aria-label="lastlink home" onClick={onHome}>
      <svg
        className="lastlink-logo__mark"
        viewBox="0 0 48 32"
        aria-hidden="true"
      >
        <path className="lastlink-logo__route" d="M7 24h13c5 0 5-16 11-16h10" />
        <circle className="lastlink-logo__origin" cx="7" cy="24" r="4" />
        <circle className="lastlink-logo__destination" cx="41" cy="8" r="4" />
      </svg>
      {wordmark}
    </a>
  )
}
