import { useEffect, useState } from 'react'

/** Updates presentation only; never polls transport APIs. */
export function useDisplayClock() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const update = () => setNow(previous => Math.max(previous, Date.now()))
    const interval = window.setInterval(update, 15_000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return now
}
