import { useEffect, useRef, useState } from 'react'
import './App.css'
import { JourneyAnswer } from './components/JourneyAnswer'
import { JourneyForm } from './components/JourneyForm'
import type { JourneyResponse } from './types/journey'

function App() {
  const [response, setResponse] = useState<JourneyResponse | null>(null)
  const answerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!response || !answerRef.current) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    answerRef.current.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
    answerRef.current.focus({ preventScroll: true })
  }, [response])

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="lastlink home">
          lastlink
        </a>
        <span className="scope-note">TfL station arrival</span>
      </header>

      <div className="workspace">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Late-night journey check</p>
          <h1 id="page-title">Can you reach the station in time?</h1>
          <p className="intro-copy">
            Start with a Tube station, London address or landmark. Choose the
            station you need to reach and we will check whether the configured
            TfL source can get you there by your deadline. The route may use
            Tube, bus, rail or walking.
          </p>
        </section>

        <JourneyForm onResponse={setResponse} onRequestStart={() => setResponse(null)} />

        {response && <JourneyAnswer response={response} answerRef={answerRef} />}
      </div>

      <footer className="footer-note">
        <p>LastLink checks the journey to the station. It does not confirm the onward train.</p>
      </footer>
    </main>
  )
}

export default App
