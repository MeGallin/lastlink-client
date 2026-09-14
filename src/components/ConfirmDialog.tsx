import { useEffect } from 'react'
import { Button } from './ui'
import { useDialogSurface } from './useDialogSurface'
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
  const { dialogRef, open, close, finish } = useDialogSurface()
  useEffect(() => {
    open()
  }, [open])
  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={() => { close(); onCancel() }}
      onClose={() => finish()}
    >
      <h2 id="confirm-title">{title}</h2>
      <p>{message}</p>
      <div className="journey-actions">
        <Button type="button" variant="secondary" autoFocus onClick={() => { close(); onCancel() }}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={() => { close(); onConfirm() }}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
