import { currentEvidenceAge, formatEvidenceAge } from './evidence-age'

export function EvidenceAge({ ageSeconds, checkedAt, now }: { ageSeconds: number | null; checkedAt: string; now: number }) {
  return <small aria-live="off">{formatEvidenceAge(currentEvidenceAge(ageSeconds, checkedAt, now))}</small>
}
