import { LastLinkLogo } from './LastLinkLogo'
import { MobileNav } from './MobileNav'
import { siteNavigationItems, type SitePage } from './navigation'

export function SiteHeader({
  currentPage,
  onJourneyHome,
}: {
  currentPage: SitePage
  onJourneyHome?: () => void
}) {
  return (
    <header className="topbar">
      <LastLinkLogo onHome={onJourneyHome} />
      <MobileNav currentPage={currentPage} onJourneyHome={onJourneyHome} />
      <nav className="site-nav" aria-label="Primary navigation">
        <ul className="site-nav__list">
          {siteNavigationItems.map((item) => {
            const isCurrent = item.page === currentPage
            return (
              <li key={item.page}>
                <a
                  href={item.href}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={item.page === 'journey' ? onJourneyHome : undefined}
                >
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
