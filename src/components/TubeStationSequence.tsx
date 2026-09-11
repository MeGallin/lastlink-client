import type { CSSProperties } from 'react'
import { getLineColor, formatLineName } from './route-flow'

interface StationSequenceStop {
  name: string
  tflStopPointId?: string
}

interface TubeStationSequenceProps {
  lineName: string
  from: string
  to: string
  stopCount: number
  intermediateStops?: StationSequenceStop[]
}

export function TubeStationSequence({
  lineName,
  from,
  to,
  stopCount,
  intermediateStops = [],
}: TubeStationSequenceProps) {
  const stops = [
    { name: from, role: 'boarding' as const },
    ...intermediateStops.map((stop) => ({
      name: stop.name,
      role: 'intermediate' as const,
    })),
    { name: to, role: 'alighting' as const },
  ]
  const lineColor = getLineColor(lineName)
  const lineLabel = formatLineName(lineName)
  const stopLabel = stopCount === 1 ? '1 stop' : `${stopCount} stops`

  return (
    <section
      className="tube-sequence"
      style={{ '--tube-sequence-color': lineColor } as CSSProperties}
      aria-label={`${lineLabel} station sequence: ${stopLabel} to ${to}`}
    >
      <ol className="tube-sequence__list">
        {stops.map((stop, index) => {
          const isLast = index === stops.length - 1
          const stopNumber = index
          const stationLabel =
            stop.role === 'boarding'
              ? 'Board here'
              : stop.role === 'alighting'
                ? `Stop ${stopCount} · Get off here`
                : `Stop ${stopNumber} of ${stopCount}`
          return (
            <li
              className={`tube-sequence__stop tube-sequence__stop--${stop.role}`}
              key={`${stop.name}-${index}`}
              aria-label={`${stop.name}, ${stationLabel}`}
            >
              <span className="tube-sequence__marker" aria-hidden="true" />
              {!isLast && <span className="tube-sequence__rail" aria-hidden="true" />}
              <div className="tube-sequence__stop-detail">
                <strong>{stop.name}</strong>
                <span>{stationLabel}</span>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="tube-sequence__note">
        Planned stops · destination included in count
      </p>
    </section>
  )
}
