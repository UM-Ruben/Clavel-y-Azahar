// Diálogo de confirmación para acciones destructivas (borrar). Controlado por
// el padre con `open`, `onConfirm` y `onCancel`.
export default function ConfirmDialog({
  open,
  title = '¿Estás segura?',
  message,
  confirmLabel = 'Sí, borrar',
  busyLabel = 'Borrando…',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[90] bg-inverse-surface/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant max-w-md w-full p-7"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <h3 className="font-headline text-2xl text-primary mb-3">{title}</h3>
        {message && <p className="font-body-md text-body-md text-on-surface-variant mb-7">{message}</p>}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors text-sm font-semibold disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="px-5 py-2.5 rounded-lg bg-error text-on-error hover:opacity-90 transition-opacity text-sm font-semibold disabled:opacity-50"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
