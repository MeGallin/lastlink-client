import { useEffect, useRef, useState } from 'react'
import './App.css'
import { ConfirmDialog } from './components/ConfirmDialog'
import { SiteHeader } from './components/SiteHeader'
import type { SitePage } from './components/navigation'
import { useJourneyWorkspace } from './journeys/useJourneyWorkspace'
import { routeName } from './journeys/journey-presentation'
import { AboutView } from './views/AboutView'
import { JourneyView } from './views/JourneyView'
import { SavedItemsView } from './views/SavedItemsView'
import { journeyStorageKey, type SavedJourney } from './journeys/journey-store'

function readPage(): SitePage {
  return window.location.hash === '#/saved'
    ? 'saved'
    : window.location.hash === '#/about'
      ? 'about'
      : 'journey'
}
function App() {
  const w = useJourneyWorkspace()
  const [page, setPage] = useState(readPage)
  const [confirmation, setConfirmation] = useState<{
    kind: 'start' | 'end' | 'remove'
    journey: SavedJourney
    expectedActiveId: string | null
  } | null>(null)
  const answerRef = useRef<HTMLElement>(null)
  const cancelRef = useRef(w.cancelCheck)
  const lastFocus = useRef('')
  const lastPage = useRef<SitePage | null>(null)
  const activeId = w.active?.id ?? null
  const viewingActive = page === 'journey' && !w.editing && w.shown?.id === activeId
  useEffect(() => {
    // A confirmation must never act on a replacement received from another tab.
    function invalidate(event: StorageEvent) {
      if (event.key === journeyStorageKey || event.key === null) setConfirmation(null)
    }
    window.addEventListener('storage', invalidate)
    return () => window.removeEventListener('storage', invalidate)
  }, [])
  useEffect(() => {
    cancelRef.current = w.cancelCheck
  }, [w.cancelCheck])
  useEffect(() => {
    function changePage() {
      cancelRef.current()
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      setPage(readPage())
    }
    window.addEventListener('hashchange', changePage)
    return () => window.removeEventListener('hashchange', changePage)
  }, [])
  useEffect(() => {
    // Route pages always begin at their own top, even when the browser preserves
    // the previous page's scroll position across hash navigation or refresh.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [page])
  useEffect(() => {
    const focusKey = page + ':' + w.focusVersion
    if (lastFocus.current === focusKey) return
    const pageChanged = lastPage.current !== page
    lastPage.current = page
    const frame = requestAnimationFrame(() => {
      lastFocus.current = focusKey
      const target =
        page === 'journey' && w.shown
          ? w.active?.id === w.shown.id && !w.editing
            ? document.getElementById('current-journey')
            : answerRef.current
          : document.querySelector<HTMLElement>('h1')
      target?.focus({ preventScroll: true })
      if (page === 'journey' && !pageChanged) target?.scrollIntoView({ block: 'start' })
      else window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
    return () => cancelAnimationFrame(frame)
    // Only deliberate page/result changes move focus, never clock or draft updates.
  }, [page, w.focusVersion, w.shown, w.active?.id, w.editing])
  function navigate(next: SitePage) {
    window.location.hash = next === 'journey' ? '/' : '/' + next
  }
  function openJourney(journey: SavedJourney) {
    w.openJourney(journey)
    navigate('journey')
  }
  function planReturnJourney(journey: SavedJourney) {
    w.planReturnJourney(journey)
    navigate('journey')
    requestAnimationFrame(() => document.getElementById('origin')?.focus())
  }
  function explore(origin?: string) {
    w.explore(origin && w.shown ? { ...w.shown.input, originName: origin } : undefined)
    navigate('journey')
    requestAnimationFrame(() => document.getElementById('origin')?.focus())
  }
  function startNewJourney() {
    w.startNewJourney()
    navigate('journey')
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.getElementById('origin')?.focus({ preventScroll: true })
    })
  }
  function confirm() {
    if (!confirmation) return
    if (confirmation.expectedActiveId === activeId) {
      if (confirmation.kind === 'start')
        w.beginJourney(confirmation.journey, confirmation.expectedActiveId)
      else if (confirmation.kind === 'end') w.endJourney(confirmation.journey.id)
      else w.forgetJourney(confirmation.journey.id)
    }
    setConfirmation(null)
  }
  return (
    <main className="app-shell">
      <SiteHeader currentPage={page} onJourneyHome={startNewJourney} />
      <div className="workspace">
        {w.storageWarning && (
          <p className="storage-warning" role="status">
            {w.storageWarning}
          </p>
        )}
        {page === 'journey' && (
          <JourneyView
            workspace={w}
            answerRef={answerRef}
            onExplore={explore}
            onStartNew={startNewJourney}
            onStart={() => {
              if (!w.shown) return
              if (w.active && w.active.id !== w.shown.id)
                setConfirmation({ kind: 'start', journey: w.shown, expectedActiveId: activeId })
              else w.beginJourney(w.shown, activeId)
            }}
            onEnd={() => {
              if (w.active)
                setConfirmation({ kind: 'end', journey: w.active, expectedActiveId: activeId })
            }}
          />
        )}
        {page === 'saved' && (
          <SavedItemsView
            journeys={w.library.journeys}
            activeId={w.active?.id ?? null}
            onResume={openJourney}
            onPlanReturn={planReturnJourney}
            onRemove={(journey) =>
              setConfirmation({ kind: 'remove', journey, expectedActiveId: activeId })
            }
            onEnd={(journey) =>
              setConfirmation({ kind: 'end', journey, expectedActiveId: activeId })
            }
          />
        )}
        {page === 'about' && <AboutView />}
      </div>
      {w.active && !viewingActive && (
        <aside className="active-return" aria-label="Protected current journey">
          <span>
            <strong>Your journey</strong> {routeName(w.active.input)}
          </span>
          <button type="button" onClick={() => openJourney(w.active!)}>
            Back to my journey
          </button>
        </aside>
      )}
      <footer className="footer-note">
        <p>Station arrival only. Onward trains are not checked.</p>
      </footer>
      {confirmation && (
        <ConfirmDialog
          title={
            confirmation.kind === 'start'
              ? 'Replace your current journey?'
              : confirmation.kind === 'end'
                ? 'End this journey?'
                : 'Remove this saved plan?'
          }
          message={
            confirmation.kind === 'start'
              ? routeName(confirmation.journey.input) +
                ' will become your protected journey. Your previous journey becomes a recent check and may later be removed by the three-journey limit.'
              : confirmation.kind === 'end'
                ? routeName(confirmation.journey.input) +
                  ' will no longer be protected. Its saved plan stays in recent checks until removed or replaced by the history limit.'
                : routeName(confirmation.journey.input) +
                  ' will be removed from this browser and, if open, from the journey page. Other journeys are unchanged.'
          }
          confirmLabel={
            confirmation.kind === 'start'
              ? 'Replace journey'
              : confirmation.kind === 'end'
                ? 'End journey'
                : 'Remove plan'
          }
          onConfirm={confirm}
          onCancel={() => setConfirmation(null)}
        />
      )}
    </main>
  )
}
export default App
