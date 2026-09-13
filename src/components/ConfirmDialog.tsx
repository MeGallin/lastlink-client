import { useEffect, useRef } from 'react'
import { Button } from './ui'
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialog.current?.showModal()
  }, [])
  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={onCancel}
    >
      <h2 id="confirm-title">{title}</h2>
      <p>{message}</p>
      <div className="journey-actions">
        <Button type="button" variant="secondary" autoFocus onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
