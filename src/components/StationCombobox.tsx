import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { tubeStations } from '../data/stations'
import { TextInput } from './ui'

interface StationComboboxProps {
  id: string
  label: string
  value: string
  placeholder: string
  helpText: string
  describedBy: string
  invalid: boolean
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
        ? tubeStations.filter((station) => station.name.toLowerCase().includes(normalizedQuery))
        : tubeStations,
    [normalizedQuery],
  )

  const pickerOptions = useMemo(
    () => matchingStations.map((station) => ({ kind: 'station' as const, name: station.name })),
    [matchingStations],
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
        pickerOptions.length === 0
          ? -1
          : current >= pickerOptions.length - 1
            ? 0
            : current + 1,
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      onOpen()
      setActiveIndex((current) =>
        pickerOptions.length === 0
          ? -1
          : current <= 0
            ? pickerOptions.length - 1
            : current - 1,
      )
      return
    }

    if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
      event.preventDefault()
      const option = pickerOptions[activeIndex]
      if (option) selectStation(option.name)
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
        <TextInput
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
        {value && (
          <button
            className="station-picker__clear"
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              onChange('')
              openOptions()
              inputRef.current?.focus()
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
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
          {pickerOptions.length > 0 ? (
            <ul
              className="station-picker__options"
              id={listboxId}
              role="listbox"
              aria-label={`${label} suggestions`}
            >
              {pickerOptions.map((option, index) => (
                <li
                  aria-posinset={index + 1}
                  aria-selected={option.name === value}
                  className={`${index === activeIndex ? 'is-active ' : ''}station-picker__option--${option.kind}`}
                  id={`${listboxId}-option-${index}`}
                  key={`${option.kind}-${option.name}`}
                  role="option"
                  aria-setsize={pickerOptions.length}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectStation(option.name)}
                >
                  {option.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="station-picker__empty" role="status">
              No matching Tube stations. Choose a station from the TfL list.
            </p>
          )}
        </div>
      )}

      <small id={`${id}-help`}>{helpText}</small>
    </div>
  )
}
