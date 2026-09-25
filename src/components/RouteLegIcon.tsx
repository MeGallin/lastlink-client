import { Bus, PersonSimpleWalk, Question, Subway, Train } from '@phosphor-icons/react'
import { getRouteIconKind } from './route-flow'

export function RouteLegIcon({ mode, lineName }: { mode: string; lineName?: string }) {
  switch (getRouteIconKind(mode, lineName)) {
    case 'walk':
      return <PersonSimpleWalk aria-hidden="true" size={26} weight="regular" />
    case 'tube':
      return <Subway aria-hidden="true" size={26} weight="regular" />
    case 'bus':
      return <Bus aria-hidden="true" size={26} weight="regular" />
    case 'rail':
      return <Train aria-hidden="true" size={26} weight="regular" />
    default:
      return <Question aria-hidden="true" size={26} weight="regular" />
  }
}
