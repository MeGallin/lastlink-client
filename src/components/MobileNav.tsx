import { useEffect, useState } from 'react'
import { siteNavigationItems, type SitePage } from './navigation'
import { LastLinkLogo } from './LastLinkLogo'
import { useDialogSurface } from './useDialogSurface'

export type MobileNavPage = SitePage

type MobileNavProps = {
  currentPage: MobileNavPage
  onJourneyHome?: () => void
}

export function MobileNav({ currentPage, onJourneyHome }: MobileNavProps) {
  const { dialogRef, open, close, finish } = useDialogSurface()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      open()
    } else if (!isOpen && dialog.open) {
      close()
    }
  }, [isOpen, dialogRef, open, close])

  function closeMenu(restoreFocus = true) {
    close(restoreFocus)
    setIsOpen(false)
  }

  return (
    <>
      <button
        className="mobile-nav-toggle"
        type="button"
        aria-controls="mobile-navigation"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        onClick={() => setIsOpen(true)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        className="mobile-nav-sheet"
        aria-labelledby="mobile-navigation-title"
        onClose={() => { finish(); setIsOpen(false) }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu()
        }}
      >
        <button className="mobile-nav-sheet__close" type="button" autoFocus onClick={() => closeMenu()}>
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close navigation</span>
        </button>

        <div className="mobile-nav-sheet__content">
          <p className="mobile-nav-sheet__eyebrow">
            Move around <LastLinkLogo variant="wordmark" inverse />
          </p>
          <h2 id="mobile-navigation-title">Where do you want to go?</h2>
          <nav aria-label="Mobile navigation">
            <ul className="mobile-nav-sheet__list">
              {siteNavigationItems.map((item) => (
                <li key={item.page}>
                  <a
                    className={item.page === currentPage ? 'is-current' : undefined}
                    href={item.href}
                    aria-current={item.page === currentPage ? 'page' : undefined}
                    onClick={() => {
                      if (item.page === 'journey') onJourneyHome?.()
                      closeMenu(false)
                    }}
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  )
}
