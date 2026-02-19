import type { Job } from "@/lib/types";
import type { KeyboardEvent } from "react";
import CompanyMark from "./CompanyMark";
import styles from "./JobCard.module.css";

type JobCardProps = {
  job: Job;
  isSubmitting: boolean;
  isPreview: boolean;
  isSelected?: boolean;
  variant?: "row" | "list" | "detail";
  showActions?: boolean;
  onAccept: () => void;
  onReject: () => void;
  onOpen?: () => void;
};

export default function JobCard({
  job,
  isSubmitting,
  isPreview,
  isSelected = false,
  variant = "detail",
  showActions = true,
  onAccept,
  onReject,
  onOpen,
}: JobCardProps) {
  const payLabel = `$${job.pay.toFixed(2)}/hr`;
  const distanceLabel =
    typeof job.distanceMiles === "number"
      ? `${job.distanceMiles.toFixed(1)} mi`
      : "--";
  const startLabel = job.startDate ?? "--";

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  const showCompactChips = variant !== "detail";
  const shouldShowActions = showActions && !isPreview;

  return (
    <article
      className={`${styles.card} ${styles[variant]} ${
        onOpen ? styles.cardInteractive : ""
      } ${isSelected ? styles.selected : ""} ${
        !shouldShowActions ? styles.noActions : ""
      }`}
      aria-live="polite"
      aria-selected={isSelected}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={handleCardKeyDown}
    >
      <div className={styles.mark}>
        <CompanyMark company={job.company} title={job.title} />
      </div>
      <div className={styles.main}>
        <div className={styles.header}>
          <h3 className={styles.title}>{job.title}</h3>
        </div>
        <p className={styles.companyLine}>{job.company}</p>
        <p className={styles.metaLine}>
          {job.industry}
          {/* {job.location ? ` · ${job.location}` : ""} */}
        </p>
        <div className={styles.chips}>
          {showCompactChips ? (
            <>
              {/* <span className={styles.chip}>
                <span className={styles.chipLabel}>Pay</span>
                <span className={styles.chipValue}>{payLabel}</span>
              </span>
              <span className={styles.chip}>
                <span className={styles.chipLabel}>Distance</span>
                <span className={styles.chipValue}>{distanceLabel}</span>
              </span> */}
            </>
          ) : (
            <>
              <span className={styles.chip}>
                <span className={styles.chipLabel}>Match</span>
                <span className={styles.chipValue}>{job.matchScore.toFixed(1)}</span>
              </span>
              <span className={styles.chip}>
                <span className={styles.chipLabel}>Distance</span>
                <span className={styles.chipValue}>{distanceLabel}</span>
              </span>
              <span className={styles.chip}>
                <span className={styles.chipLabel}>Start</span>
                <span className={styles.chipValue}>{startLabel}</span>
              </span>
            </>
          )}
        </div>
      </div>
      <div className={styles.side}>
        <div className={styles.payBlock}>
          <span className={styles.payLabel}>Pay</span>
          <span className={styles.payValue}>{payLabel}</span>
        </div>
        {shouldShowActions ? (
          <div className={styles.actions}>
            <button
              className={styles.acceptButton}
              onClick={(event) => {
                event.stopPropagation();
                onAccept();
              }}
              disabled={isSubmitting || isPreview}
              aria-label={`Accept ${job.title}`}
            >
              {isSubmitting ? (
                <span className={styles.inlineSpinner}>Submitting...</span>
              ) : (
                "Accept"
              )}
            </button>
            <button
              className={styles.rejectButton}
              onClick={(event) => {
                event.stopPropagation();
                onReject();
              }}
              disabled={isSubmitting || isPreview}
              aria-label={`Not interested in ${job.title}`}
            >
              {isSubmitting ? (
                <span className={styles.inlineSpinner}>Submitting...</span>
              ) : (
                "Not interested"
              )}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
