import { useEffect, useState } from 'react'
import { StationCombobox } from './StationCombobox'
import { findStationByName } from '../data/stations'
import type { JourneyInput } from '../journeys/journey-store'
import { JourneyCheckFeedback, type JourneyCheckError } from './JourneyCheckFeedback'
import { Button, FormField, SelectControl, TextInput } from './ui'
import {
  earliestFutureDateTimeValue,
  futureDeadlinePresets,
  parseLocalDateTimeValue,
} from './journey-time'

export type DeadlineEdit =
  | { kind: 'preset'; atMs: number }
  | { kind: 'manual'; atMs?: number }

interface JourneyFormProps {
  values: JourneyInput
  deadlineAtMs?: number | null
  onChange: (input: JourneyInput, deadlineEdit?: DeadlineEdit) => void
  onCheck: (input: JourneyInput) => void
  pending: JourneyInput | null
  error: JourneyCheckError | null
  previousName?: string
  returnFrom?: string
}
export function JourneyForm({
  values,
  deadlineAtMs,
  onChange,
  onCheck,
  pending,
  error,
  previousName,
  returnFrom,
}: JourneyFormProps) {
  const [openPickerId, setOpenPickerId] = useState<string | null>(null)
  const [minimumArriveBy, setMinimumArriveBy] = useState(() => earliestFutureDateTimeValue())
  useEffect(() => {
    const refreshMinimum = () => setMinimumArriveBy(earliestFutureDateTimeValue())
    const timer = window.setInterval(refreshMinimum, 30_000)
    return () => window.clearInterval(timer)
  }, [])
  function change(key: keyof JourneyInput, value: string) {
    onChange(
      { ...values, [key]: value },
      key === 'arriveBy'
        ? { kind: 'manual', atMs: parseLocalDateTimeValue(value) }
        : undefined,
    )
  }
  const canSwap =
    !!findStationByName(values.originName) && !!findStationByName(values.destinationName)
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const timeZoneLabel = timeZone === 'Europe/London' ? 'UK time' : `${timeZone} on this device`
  const arriveByError = error?.field === 'arriveBy' ? error.message : null
  const arriveByAtMs =
    deadlineAtMs === undefined ? parseLocalDateTimeValue(values.arriveBy) : deadlineAtMs ?? undefined
  const minimumArriveByAtMs = parseLocalDateTimeValue(minimumArriveBy)
  const arriveByHasPassed =
    arriveByAtMs !== undefined &&
    minimumArriveByAtMs !== undefined &&
    arriveByAtMs < minimumArriveByAtMs
  const arriveByMessage =
    arriveByError ??
    (arriveByHasPassed ? 'This deadline has passed. Choose a future time before checking.' : null)
  const deadlinePresets = futureDeadlinePresets()
  return (
    <section className="journey-panel" aria-label="Plan a journey" aria-busy={!!pending}>
      <form
        id="journey-check-form"
        className="journey-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!pending) onCheck(values)
        }}
      >
        {returnFrom && (
          <div className="journey-form__context" role="status">
            <p className="eyebrow">Return journey</p>
            <p>
              Based on <strong>{returnFrom}</strong>. Choose when you need to arrive back, then
              check the reversed route.
            </p>
          </div>
        )}
        <div className="field-grid">
          <div className="field">
            <label htmlFor="origin">Starting point</label>
            <StationCombobox
              describedBy="origin-help"
              id="origin"
              invalid={error?.field === 'origin'}
              label="Starting point"
              helpText="Choose a Tube station from the TfL list"
              openPickerId={openPickerId}
              onOpen={() => setOpenPickerId('origin')}
              onClose={() => setOpenPickerId(null)}
              placeholder="Where are you starting?"
              value={values.originName}
              onChange={(value) => change('originName', value)}
            />
          </div>
          <div className="field">
            <div className="field-label-row">
              <label htmlFor="destination">Station to reach</label>
              <Button
                type="button"
                variant="text"
                className="swap-action"
                disabled={!canSwap}
                title={
                  canSwap ? 'Swap starting and destination stations' : 'Swap needs two Tube stations'
                }
                onClick={() => {
                  setOpenPickerId(null)
                  onChange({
                    ...values,
                    originName: values.destinationName,
                    destinationName: values.originName,
                  })
                }}
              >
                <span aria-hidden="true">⇅</span> Swap stations
              </Button>
            </div>
            <StationCombobox
              describedBy="destination-help"
              id="destination"
              invalid={error?.field === 'destination'}
              label="Destination"
              helpText="Tube station only — choose from the TfL list"
              openPickerId={openPickerId}
              onOpen={() => setOpenPickerId('destination')}
              onClose={() => setOpenPickerId(null)}
              placeholder="Which station?"
              value={values.destinationName}
              onChange={(value) => change('destinationName', value)}
            />
          </div>
        </div>
        <div className="field-grid field-grid-secondary">
          <FormField
            label={returnFrom ? 'Arrive back by' : 'Arrive by'}
            htmlFor="arriveBy"
            helpText={`Be ${returnFrom ? 'back at' : 'at'} the destination Tube station by this time. Past times are unavailable. Uses ${timeZoneLabel}; results are shown in London time.`}
            helpId="arrive-by-help"
          >
            <TextInput
              id="arriveBy"
              type="datetime-local"
              value={values.arriveBy}
              required
              onChange={(event) => change('arriveBy', event.target.value)}
              min={minimumArriveBy}
              aria-invalid={!!arriveByMessage}
              aria-errormessage={arriveByMessage ? 'arrive-by-error' : undefined}
              aria-describedby={
                ['arrive-by-help', arriveByMessage ? 'arrive-by-error' : null]
                  .filter(Boolean)
                  .join(' ')
              }
            />
            {arriveByMessage && (
              <span id="arrive-by-error" className="field-error">
                {arriveByMessage}
              </span>
            )}
            <div className="deadline-presets" role="group" aria-label="Quick arrival time choices">
              <span className="deadline-presets__label">Quick choices</span>
              <div className="deadline-presets__options">
                {deadlinePresets.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant="text"
                    className="deadline-preset"
                    data-selected={values.arriveBy === preset.value ? 'true' : undefined}
                    onClick={() =>
                      onChange(
                        { ...values, arriveBy: preset.value },
                        { kind: 'preset', atMs: preset.atMs },
                      )
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </FormField>
          <FormField label="Safety margin" htmlFor="safetyBuffer" helpText="Extra time at your destination">
            <SelectControl
              id="safetyBuffer"
              value={values.safetyBufferMinutes}
              onChange={(event) => change('safetyBufferMinutes', event.target.value)}
            >
              <option value="0">No extra margin</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
            </SelectControl>
          </FormField>
        </div>
        <JourneyCheckFeedback
          error={error}
          pending={pending}
          previousName={previousName}
        />
        <Button variant="primary" type="submit" disabled={!!pending}>
          {pending ? 'Checking…' : 'Check my route'}
        </Button>
      </form>
    </section>
  )
}
