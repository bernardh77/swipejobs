import type { Job, JobDecision } from "@/lib/types";
import type { KeyboardEvent } from "react";
import CompanyMark from "./CompanyMark";
import styles from "./JobCard.module.css";

type JobCardProps = {
  job: Job;
  isSubmitting: boolean;
  isPreview: boolean;
  isSelected?: boolean;
  pendingDecision?: JobDecision | null;
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
  pendingDecision = null,
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
  const shiftCount =
    typeof job.shiftCount === "number"
      ? job.shiftCount
      : job.shifts?.length ?? null;
  const compactMeta = [
    typeof job.distanceMiles === "number" ? distanceLabel : null,
    startLabel !== "--" ? `Start ${startLabel}` : null,
    typeof shiftCount === "number"
      ? `${shiftCount} shift${shiftCount === 1 ? "" : "s"}`
      : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  const showCompactChips = variant !== "detail";
  const isPending = Boolean(pendingDecision);
  const shouldShowActions = showActions && !isPreview;

  return (
    <article
      className={`${styles.card} ${styles[variant]} ${
        onOpen ? styles.cardInteractive : ""
      } ${isSelected ? styles.selected : ""} ${
        !shouldShowActions ? styles.noActions : ""
      } ${isPending ? styles.pending : ""}`}
      aria-live="polite"
      aria-selected={isSelected}
      aria-busy={isPending || undefined}
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
          <span className={styles.compactPay}>{payLabel}</span>
        </div>
        <p className={styles.companyLine}>{job.company}</p>
        <p className={styles.metaLine}>
          {job.industry}
          {/* {job.location ? ` · ${job.location}` : ""} */}
        </p>
        {compactMeta ? (
          <p className={styles.compactMeta}>{compactMeta}</p>
        ) : null}
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
        {isPending ? (
          <span className={styles.pendingLabel}>
            Pending {pendingDecision === "accepted" ? "accept" : "reject"}
          </span>
        ) : null}
        <div className={styles.payBlock}>
          <span className={styles.payLabel}>Pay</span>
          <span className={styles.payValue}>{payLabel}</span>
        </div>
        <span className={styles.chevron} aria-hidden="true">
          ›
        </span>
        {shouldShowActions ? (
          <div className={styles.actions}>
            <button
              className={styles.acceptButton}
              onClick={(event) => {
                event.stopPropagation();
                onAccept();
              }}
              disabled={isSubmitting || isPreview || isPending}
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
              disabled={isSubmitting || isPreview || isPending}
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
