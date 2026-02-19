import styles from "./Toast.module.css";

type ToastProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
};

export default function Toast({
  message,
  actionLabel,
  onAction,
  onClose,
}: ToastProps) {
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span>{message}</span>
      <div className={styles.actions}>
        {actionLabel && onAction ? (
          <button className={styles.actionButton} onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
        {onClose ? (
          <button className={styles.closeButton} onClick={onClose}>
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
