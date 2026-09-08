import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { tubeStations } from '../data/stations'

interface StationComboboxProps {
  id: string
  label: string
  value: string
  placeholder: string
  helpText: string
  describedBy: string
  invalid: boolean
  allowFreeForm: boolean
  openPickerId: string | null
  onOpen: () => void
  onClose: () => void
  onChange: (value: string) => void
}

export function StationCombobox({
  id,
  label,
  value,
  placeholder,
  helpText,
  describedBy,
  invalid,
  allowFreeForm,
  openPickerId,
  onOpen,
  onClose,
  onChange,
}: StationComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const isOpen = openPickerId === id
  const listboxId = `${id}-options`
  const normalizedQuery = value.trim().toLowerCase()
  const matchingStations = useMemo(
    () =>
      normalizedQuery
        ? tubeStations.filter((station) =>
            station.name.toLowerCase().includes(normalizedQuery),
          )
        : tubeStations,
    [normalizedQuery],
  )

  function openOptions() {
    onOpen()
    setActiveIndex(-1)
  }

  function selectStation(name: string) {
    onChange(name)
    onClose()
    setActiveIndex(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      onOpen()
      setActiveIndex((current) =>
        matchingStations.length === 0
          ? -1
          : current >= matchingStations.length - 1
            ? 0
            : current + 1,
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      onOpen()
      setActiveIndex((current) =>
        matchingStations.length === 0
          ? -1
          : current <= 0
            ? matchingStations.length - 1
            : current - 1,
      )
      return
    }

    if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
      event.preventDefault()
      const station = matchingStations[activeIndex]
      if (station) selectStation(station.name)
      return
    }

    if (event.key === 'Escape') {
      onClose()
      setActiveIndex(-1)
    }
  }

  function handleBlur() {
    onClose()
    setActiveIndex(-1)
  }

  function handleToggleMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
  }

  function handleToggleClick() {
    if (isOpen) {
      onClose()
      setActiveIndex(-1)
      return
    }
    openOptions()
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className="station-picker">
      <div className="station-picker__control">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onChange={(event) => {
            onChange(event.target.value)
            onOpen()
            setActiveIndex(-1)
          }}
          onFocus={openOptions}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        <button
          className="station-picker__toggle"
          type="button"
          aria-label={`Show ${label.toLowerCase()} options`}
          aria-expanded={isOpen}
          aria-controls={listboxId}
          onMouseDown={handleToggleMouseDown}
          onClick={handleToggleClick}
        >
          <span aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div className="station-picker__popup">
          {matchingStations.length > 0 ? (
            <ul
              className="station-picker__options"
              id={listboxId}
              role="listbox"
              aria-label={`${label} suggestions`}
            >
              {matchingStations.map((station, index) => (
                <li
                  aria-posinset={index + 1}
                  aria-selected={station.name === value}
                  className={index === activeIndex ? 'is-active' : undefined}
                  id={`${listboxId}-option-${index}`}
                  key={station.id}
                  role="option"
                  aria-setsize={matchingStations.length}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectStation(station.name)}
                >
                  {station.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="station-picker__empty" role="status">
              No matching Tube stations.
              {allowFreeForm && ' You can still use this as a London address or landmark.'}
            </p>
          )}
        </div>
      )}

      <small id={`${id}-help`}>{helpText}</small>
    </div>
  )
}
