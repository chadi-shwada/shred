import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Fenêtre de confirmation d'une action destructrice, à la place de
 * window.confirm. Repose sur <dialog> en mode modal : le focus reste dedans,
 * Échap annule, et le navigateur rend le focus à l'élément d'origine. Le
 * bouton « Annuler » a le focus à l'ouverture (choix le moins risqué).
 */
export function ConfirmDialog({ open, title, children, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="confirm"
      aria-labelledby={titleId}
      aria-describedby={textId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        // Un clic sur le fond (hors de la boîte) annule.
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="confirm__box">
        <span className="confirm__icon" aria-hidden="true">
          <Icon name="trash" size={20} />
        </span>
        <h2 id={titleId} className="confirm__title">
          {title}
        </h2>
        <div id={textId} className="confirm__text">
          {children}
        </div>
        <div className="confirm__actions">
          <button type="button" className="btn" onClick={onCancel} autoFocus>
            Annuler
          </button>
          <button type="button" className="btn btn--danger-solid" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
