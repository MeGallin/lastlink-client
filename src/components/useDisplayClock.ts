import { useEffect, useState } from 'react'

/** Updates presentation only; never polls transport APIs. */
export function useDisplayClock(intervalMs = 15_000) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const update = () => setNow(previous => Math.max(previous, Date.now()))
    const interval = window.setInterval(update, intervalMs)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [intervalMs])
  return now
}
