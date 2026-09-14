import { useCallback, useEffect, useRef } from 'react'

/** Native modal semantics, shared scroll locking and deliberate focus return. */
export function useDialogSurface() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const previousOverflow = useRef<string | null>(null)

  const unlock = useCallback(() => {
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current
      previousOverflow.current = null
    }
  }, [])

  const finish = useCallback((restoreFocus = true) => {
    const target = opener.current
    opener.current = null
    unlock()
    if (restoreFocus && target) {
      requestAnimationFrame(() => {
        const destination = target !== document.body && target.isConnected && target.getClientRects().length > 0
          ? target
          : document.querySelector<HTMLElement>('h1')
        destination?.focus({ preventScroll: true })
      })
    }
  }, [unlock])

  const open = useCallback(() => {
    const element = dialogRef.current
    if (!element) return
    if (!element.open) {
      opener.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      element.showModal()
    }
    if (previousOverflow.current === null) {
      previousOverflow.current = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
  }, [])

  const close = useCallback((restoreFocus = true) => {
    dialogRef.current?.close()
    finish(restoreFocus)
  }, [finish])

  // Effect replay in StrictMode is not a dialog dismissal. Release the global
  // scroll lock on cleanup, but retain the opener for the still-open dialog.
  // A true unmount also releases the lock; React then releases these local refs.
  useEffect(() => unlock, [unlock])
  return { dialogRef, open, close, finish }
}
