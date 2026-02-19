import { useMemo, useState } from "react";
import type { Job } from "@/lib/types";
import styles from "./JobDetailsPanel.module.css";

type JobDetailsPanelProps = {
  job: Job;
  maxDistance?: number;
  isSubmitting?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  showActions?: boolean;
};

export default function JobDetailsPanel({
  job,
  maxDistance,
  isSubmitting = false,
  onAccept,
  onReject,
  showActions = true,
}: JobDetailsPanelProps) {
  const [showAllShifts, setShowAllShifts] = useState(false);
  const distance = job.distanceMiles ?? 0;
  const isOutOfRange =
    typeof maxDistance === "number" && distance > maxDistance;
  const pay = Number.isFinite(job.pay) ? `$${job.pay.toFixed(2)}/hr` : "—";
  const address = job.address ?? job.location ?? "—";
  const branch = job.branch ?? job.industry ?? "—";
  const reportTo = job.reportTo?.name ?? "—";
  const reportPhone = job.reportTo?.phone ?? "";
  const branchPhone = job.branchPhoneNumber ?? "";

  const shifts = useMemo(() => {
    if (!job.shifts) {
      return [];
    }
    return job.shifts
      .map((shift) => ({
        start: shift.startDate ?? "",
        date: formatShiftDate(shift.startDate, job.timeZone),
        time: formatShiftTimeRange(shift.startDate, shift.endDate, job.timeZone),
      }))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [job.shifts, job.timeZone]);

  const shiftSummary = useMemo(() => {
    if (shifts.length === 0) {
      return { countLabel: "No shifts", rangeLabel: "—" };
    }
    const first = shifts[0]?.start;
    const last = shifts[shifts.length - 1]?.start;
    const firstLabel = formatShiftDate(first, job.timeZone);
    const lastLabel = formatShiftDate(last, job.timeZone);
    const rangeLabel = firstLabel === lastLabel ? firstLabel : `${firstLabel}–${lastLabel}`;
    return {
      countLabel: `${shifts.length} shift${shifts.length === 1 ? "" : "s"}`,
      rangeLabel,
    };
  }, [job.timeZone, shifts]);

  const showShifts = showAllShifts ? shifts : shifts.slice(0, 5);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h1 className={styles.title}>{job.title}</h1>
        <p className={styles.company}>{job.company}</p>
        <div className={styles.addressLine}>
          <span aria-hidden="true">📍</span>
          <span className={styles.addressText}>{address}</span>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>Details</h2>
            </div>
            <div className={styles.detailsGrid}>
              <div>
                <span className={styles.metaLabel}>Branch</span>
                <span className={styles.metaValue}>{branch}</span>
                {branchPhone ? (
                  <span className={styles.metaSub}>{branchPhone}</span>
                ) : null}
              </div>
              <div>
                <span className={styles.metaLabel}>Report to</span>
                <span className={styles.metaValue}>{reportTo}</span>
                {reportPhone ? (
                  <span className={styles.metaSub}>{reportPhone}</span>
                ) : null}
              </div>
            </div>
            <div className={styles.requirementsBlock}>
              <span className={styles.metaLabel}>Requirements</span>
              {job.requirements?.length ? (
                <div className={styles.requirementsChips}>
                  {job.requirements.map((req) => (
                    <span key={req} className={styles.requirementChip}>
                      {req}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={styles.muted}>No requirements listed.</p>
              )}
            </div>
          </section>

          <section className={`${styles.sectionCard} ${styles.scheduleCard}`}>
            <div className={styles.sectionHeader}>
              <h2>Schedule</h2>
              {shifts.length > 5 ? (
                <button
                  className={styles.shiftToggle}
                  type="button"
                  onClick={() => setShowAllShifts((prev) => !prev)}
                  aria-expanded={showAllShifts}
                >
                  {showAllShifts ? "Show less" : `Show all (${shifts.length})`}
                </button>
              ) : null}
            </div>
            {shifts.length === 0 ? (
              <p className={styles.muted}>No shifts available.</p>
            ) : (
              <ul
                className={`${styles.shiftList} ${
                  showAllShifts ? styles.shiftListExpanded : ""
                }`}
              >
                {showShifts.map((shift, index) => (
                  <li key={`${shift.date}-${index}`} className={styles.shiftItem}>
                    <span className={styles.shiftDate}>{shift.date}</span>
                    <span className={styles.shiftTime}>{shift.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className={styles.summaryColumn}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              {isOutOfRange && maxDistance !== undefined ? (
                <span className={styles.outBadge}>
                  Outside your {maxDistance} mi preference
                </span>
              ) : null}
            </div>
            <div className={styles.summaryPay}>{pay}</div>
            <div className={styles.summaryMeta}>
              <div>
                <span className={styles.summaryLabel}>Distance</span>
                <span className={styles.summaryValue}>{distance.toFixed(1)} mi</span>
              </div>
              <div>
                <span className={styles.summaryLabel}>Schedule</span>
                <span className={styles.summaryValue}>
                  {shiftSummary.countLabel} · {shiftSummary.rangeLabel}
                </span>
              </div>
            </div>
            {showActions && onAccept && onReject ? (
              <div className={styles.actions}>
                <button
                  className={styles.acceptButton}
                  onClick={onAccept}
                  disabled={isSubmitting}
                  aria-label={`Accept ${job.title}`}
                >
                  {isSubmitting ? "Submitting..." : "Accept"}
                </button>
                <button
                  className={styles.rejectButton}
                  onClick={onReject}
                  disabled={isSubmitting}
                  aria-label={`Not interested in ${job.title}`}
                >
                  {isSubmitting ? "Submitting..." : "Not interested"}
                </button>
              </div>
            ) : null}
            {showActions ? (
              <p className={styles.helperText}>Review the schedule before deciding.</p>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

function formatShiftDate(value?: string, timeZone?: string): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(date);
}

function formatShiftTimeRange(
  start?: string,
  end?: string,
  timeZone?: string
): string {
  if (!start || !end) {
    return "varies";
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "varies";
  }
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  return `${formatter.format(startDate)}–${formatter.format(endDate)}`;
}
