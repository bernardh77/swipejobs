"use client";

import { useEffect, useRef } from "react";
import styles from "./AcceptModal.module.css";
import type { Job } from "@/lib/types";

type AcceptModalProps = {
  job: Job | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export default function AcceptModal({
  job,
  isOpen,
  onConfirm,
  onCancel,
  isSubmitting,
  error,
}: AcceptModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  if (!job) return null;

  if (error) {
    return (
      <dialog ref={dialogRef} className={styles.dialog} onClose={onCancel}>
        <div className={styles.content}>
          <h2 className={styles.title}>This job is no longer available</h2>
          <p className={styles.text}>{error}</p>
          <div className={styles.actions}>
            <button
              className={styles.cancelBtn}
              onClick={onCancel}
              type="button"
            >
              Close
            </button>
            {/* <button
              className={styles.confirmBtn}
              onClick={onCancel}
              type="button"
            >
              View other matches
            </button> */}
          </div>
        </div>
      </dialog>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onCancel}
    >
      <div className={styles.content}>
        <h2 className={styles.title}>Confirm Accept</h2>
        <p className={styles.text}>
          Are you sure you want to accept the <strong>{job.title}</strong> role at <strong>{job.company}</strong>?
        </p>
        <div className={styles.actions}>
          <button 
            className={styles.cancelBtn} 
            onClick={onCancel}
            disabled={isSubmitting}
            type="button"
          >
            Cancel
          </button>
          <button 
            className={styles.confirmBtn} 
            onClick={onConfirm}
            disabled={isSubmitting}
            type="button"
          >
            {isSubmitting ? "Accepting..." : "Yes, Accept"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
