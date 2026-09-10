import { useState } from 'react'
import type { FormEvent } from 'react'
import { requestJourneyCheck } from '../api/journey-check'
import { findStationByName } from '../data/stations'
import type { JourneyResponse } from '../types/journey'
import { StationCombobox } from './StationCombobox'

interface JourneyFormProps {
  onResponse: (response: JourneyResponse) => void
  onRequestStart: () => void
}

type InvalidField = 'origin' | 'destination' | 'arriveBy'

function toLocalDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function defaultArriveBy() {
  const date = new Date()
  date.setMinutes(date.getMinutes() + 60)
  return toLocalDateTimeValue(date)
}

export function JourneyForm({ onResponse, onRequestStart }: JourneyFormProps) {
  const [originName, setOriginName] = useState('Stratford')
  const [destinationName, setDestinationName] = useState('Waterloo')
  const [arriveBy, setArriveBy] = useState(defaultArriveBy)
  const [safetyBufferMinutes, setSafetyBufferMinutes] = useState('5')
  const [error, setError] = useState('')
  const [invalidField, setInvalidField] = useState<InvalidField | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openPickerId, setOpenPickerId] = useState<string | null>(null)

  function clearValidation() {
    setError('')
    setInvalidField(null)
  }

  function showValidationError(message: string, field: InvalidField) {
    setError(message)
    setInvalidField(field)
    window.requestAnimationFrame(() => document.getElementById(field)?.focus())
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearValidation()
    onRequestStart()

    const trimmedOriginName = originName.trim()
    const originStation = findStationByName(trimmedOriginName)
    const destination = findStationByName(destinationName)
    const date = new Date(arriveBy)

    if (!trimmedOriginName) {
      showValidationError('Add a starting point.', 'origin')
      return
    }

    if (!destination) {
      showValidationError('Choose a destination from the TfL station suggestions.', 'destination')
      return
    }

    if (originStation?.id === destination.id) {
      showValidationError(
        'Your starting point and destination are the same. Choose a different destination station.',
        'destination',
      )
      return
    }

    if (!arriveBy || Number.isNaN(date.getTime())) {
      showValidationError('Add a valid arrival time.', 'arriveBy')
      return
    }

    if (date.getTime() <= Date.now()) {
      showValidationError('Choose an arrival time in the future.', 'arriveBy')
      return
    }

    if (trimmedOriginName.length > 120) {
      showValidationError('Keep the starting point under 120 characters.', 'origin')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await requestJourneyCheck({
        origin: originStation
          ? { name: originStation.name, tflStopPointId: originStation.id }
          : { name: trimmedOriginName },
        destination,
        arriveBy,
        safetyBufferMinutes: Number(safetyBufferMinutes),
      })
      onResponse(response)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The journey check could not be completed.',
      )
      setInvalidField(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className="journey-panel"
      aria-labelledby="form-title"
      aria-busy={isSubmitting}
    >
      <div className="section-heading">
        <h2 id="form-title">Your journey</h2>
        <p>Keep it simple. You can refine the details later.</p>
      </div>

      <form className="journey-form" onSubmit={handleSubmit} noValidate>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="origin">Starting point</label>
            <StationCombobox
              allowFreeForm
              describedBy={`origin-help${invalidField === 'origin' ? ' journey-form-error' : ''}`}
              id="origin"
              invalid={invalidField === 'origin'}
              label="Starting point"
              helpText="Choose a Tube station or enter a London address or landmark."
              openPickerId={openPickerId}
              onOpen={() => setOpenPickerId('origin')}
              onClose={() => setOpenPickerId(null)}
              placeholder="Station, address or landmark"
              value={originName}
              onChange={(value) => {
                setOriginName(value)
                clearValidation()
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="destination">Station to reach</label>
            <StationCombobox
              allowFreeForm={false}
              describedBy={`destination-help${invalidField === 'destination' ? ' journey-form-error' : ''}`}
              id="destination"
              invalid={invalidField === 'destination'}
              label="Destination"
              helpText="Choose from the full TfL Tube station catalogue."
              openPickerId={openPickerId}
              onOpen={() => setOpenPickerId('destination')}
              onClose={() => setOpenPickerId(null)}
              placeholder="Type a London Tube station"
              value={destinationName}
              onChange={(value) => {
                setDestinationName(value)
                clearValidation()
              }}
            />
          </div>
        </div>

        <div className="field-grid field-grid-secondary">
          <label className="field">
            <span>Arrive by</span>
            <input
              id="arriveBy"
              type="datetime-local"
              value={arriveBy}
              min={toLocalDateTimeValue(new Date())}
              onChange={(event) => {
                setArriveBy(event.target.value)
                clearValidation()
              }}
              aria-describedby={`arrive-by-help${invalidField === 'arriveBy' ? ' journey-form-error' : ''}`}
              aria-invalid={invalidField === 'arriveBy'}
              required
            />
            <small id="arrive-by-help">Your device time zone is used.</small>
          </label>

          <label className="field">
            <span>Safety margin</span>
            <select
              value={safetyBufferMinutes}
              onChange={(event) => {
                setSafetyBufferMinutes(event.target.value)
                clearValidation()
              }}
            >
              <option value="0">No extra margin</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
            </select>
            <small>Time to find the right entrance or platform.</small>
          </label>
        </div>

        {error && (
          <p id="journey-form-error" className="form-message error-message" role="alert">
            {error}
          </p>
        )}

        {isSubmitting && (
          <p className="form-message loading-message" role="status">
            Checking the configured TfL journey source…
          </p>
        )}

        <button className="primary-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Checking the route...' : 'Check my route'}
        </button>

      </form>
    </section>
  )
}
