export function currentEvidenceAge(ageSeconds: number | null, checkedAt: string, nowMs: number) {
  if (ageSeconds === null) return null
  const checkedMs = Date.parse(checkedAt)
  if (!Number.isFinite(checkedMs) || !Number.isFinite(nowMs)) return null
  return ageSeconds + Math.max(0, (nowMs - checkedMs) / 1000)
}

export function formatEvidenceAge(ageSeconds: number | null) {
  if (ageSeconds === null) return 'age unavailable'
  if (ageSeconds < 60) return 'less than a minute old'
  const minutes = Math.floor(ageSeconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'} old`
}
