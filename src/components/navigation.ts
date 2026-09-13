export type SitePage = 'journey' | 'saved' | 'about'

export const siteNavigationItems: Array<{
  label: string
  page: SitePage
  href: string
}> = [
  { label: 'Plan a journey', page: 'journey', href: '#/' },
  { label: 'Saved journeys', page: 'saved', href: '#/saved' },
  { label: 'About LastLink', page: 'about', href: '#/about' },
]
