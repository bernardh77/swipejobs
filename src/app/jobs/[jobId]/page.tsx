"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toast from "@/components/jobs/Toast";
import { getMatches, getWorker, submitJobDecision, WORKER_ID } from "@/lib/api";
import type { MatchResponse, ProfileResponse } from "@/lib/types";
import styles from "./page.module.css";

type JobDetailsState = {
  job: MatchResponse | null;
  worker: ProfileResponse | null;
  error: string | null;
  isLoading: boolean;
};

export default function JobDetailsPage({
  params,
}: {
  params: { jobId: string };
}) {
  const router = useRouter();
  const [state, setState] = useState<JobDetailsState>({
    job: null,
    worker: null,
    error: null,
    isLoading: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAllShifts, setShowAllShifts] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [worker, matches] = await Promise.all([
          getWorker(WORKER_ID),
          getMatches(WORKER_ID),
        ]);
        const job = matches.find((match) => match.jobId === params.jobId) ?? null;
        if (isMounted) {
          setState({ job, worker, error: null, isLoading: false });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            job: null,
            worker: null,
            error: "Unable to load job details.",
            isLoading: false,
          });
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [params.jobId]);

  const handleDecision = async (decision: "accepted" | "rejected") => {
    if (!state.job) {
      return;
    }
    setIsSubmitting(true);
    try {
      await submitJobDecision(state.job.jobId, decision);
      setToast(decision === "accepted" ? "Accepted" : "Not interested");
      setTimeout(() => {
        router.push("/");
      }, 800);
    } catch (error) {
      setToast("Unable to update decision. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const shifts = useMemo(() => {
    if (!state.job?.shifts) {
      return [];
    }
    const timeZone = state.job.company?.address?.zoneId;
    return state.job.shifts
      .map((shift) => ({
        start: shift.startDate ?? "",
        date: formatShiftDate(shift.startDate, timeZone),
        time: formatShiftTimeRange(
          shift.startDate,
          shift.endDate,
          timeZone
        ),
      }))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [state.job]);

  const shiftSummary = useMemo(() => {
    if (shifts.length === 0) {
      return { countLabel: "No shifts", rangeLabel: "—" };
    }
    const timeZone = state.job?.company?.address?.zoneId;
    const first = shifts[0]?.start;
    const last = shifts[shifts.length - 1]?.start;
    const firstLabel = formatShiftDate(first, timeZone);
    const lastLabel = formatShiftDate(last, timeZone);
    const rangeLabel = firstLabel === lastLabel ? firstLabel : `${firstLabel}–${lastLabel}`;
    return {
      countLabel: `${shifts.length} shift${shifts.length === 1 ? "" : "s"}`,
      rangeLabel,
    };
  }, [shifts, state.job]);

  if (state.isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={`${styles.skeleton} skeleton`} />
        </div>
      </main>
    );
  }

  if (state.error || !state.job) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <Link href="/" className={styles.backLink}>
            ← Back to matches
          </Link>
          <div className={styles.notFound}>
            <h1>Job not found</h1>
            <p>{state.error ?? "We couldn't find that job."}</p>
          </div>
        </div>
      </main>
    );
  }

  const { job, worker } = state;
  const distance = job.milesToTravel ?? 0;
  const maxDistance = worker?.maxJobDistance ?? null;
  const isOutOfRange =
    typeof maxDistance === "number" && distance > maxDistance;
  const pay = job.wagePerHourInCents
    ? `$${(job.wagePerHourInCents / 100).toFixed(2)}/hr`
    : "—";
  const address = job.company?.address?.formattedAddress ?? "—";
  const branch = job.branch ?? "—";
  const reportTo = job.company?.reportTo?.name ?? "—";
  const reportPhone = job.company?.reportTo?.phone ?? "";
  const showShifts = showAllShifts ? shifts : shifts.slice(0, 5);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Back to matches
        </Link>

        <div className={styles.layout}>
          <aside className={styles.summaryColumn}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <p className={styles.summaryKicker}>Summary</p>
                {isOutOfRange && maxDistance !== null ? (
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
              <div className={styles.actions}>
                <button
                  className={styles.acceptButton}
                  onClick={() => handleDecision("accepted")}
                  disabled={isSubmitting}
                  aria-label={`Accept ${job.jobTitle?.name}`}
                >
                  {isSubmitting ? "Submitting..." : "Accept"}
                </button>
                <button
                  className={styles.rejectButton}
                  onClick={() => handleDecision("rejected")}
                  disabled={isSubmitting}
                  aria-label={`Not interested in ${job.jobTitle?.name}`}
                >
                  {isSubmitting ? "Submitting..." : "Not interested"}
                </button>
              </div>
              <p className={styles.helperText}>Review the schedule before deciding.</p>
            </div>
          </aside>

          <div className={styles.mainColumn}>
            <header className={styles.header}>
              <p className={styles.kicker}>Job Details</p>
              <h1 className={styles.title}>{job.jobTitle?.name}</h1>
              <p className={styles.company}>{job.company?.name}</p>
              <div className={styles.addressLine}>
                <span aria-hidden="true">📍</span>
                <span>{address}</span>
              </div>
              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Branch</span>
                  <span className={styles.metaValue}>{branch}</span>
                  {job.branchPhoneNumber ? (
                    <span className={styles.metaSub}>{job.branchPhoneNumber}</span>
                  ) : null}
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Report to</span>
                  <span className={styles.metaValue}>{reportTo}</span>
                  {reportPhone ? (
                    <span className={styles.metaSub}>{reportPhone}</span>
                  ) : null}
                </div>
              </div>
            </header>

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
                    {showAllShifts
                      ? "Show less"
                      : `Show all (${shifts.length})`}
                  </button>
                ) : null}
              </div>
              {shifts.length === 0 ? (
                <p className={styles.muted}>No shifts available.</p>
              ) : (
                <ul className={styles.shiftList}>
                  {showShifts.map((shift, index) => (
                    <li key={`${shift.date}-${index}`} className={styles.shiftItem}>
                      <span className={styles.shiftDate}>{shift.date}</span>
                      <span className={styles.shiftTime}>{shift.time}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.sectionCard}>
              <h2>Requirements</h2>
              {job.requirements?.length ? (
                <ul className={styles.requirementsList}>
                  {job.requirements.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>No requirements listed.</p>
              )}
            </section>

            {/* <section className={styles.sectionCard}>
              <h2>Contact</h2>
              {reportTo !== "—" || job.branchPhoneNumber ? (
                <div className={styles.contactGrid}>
                  <div>
                    <span className={styles.metaLabel}>Report to</span>
                    <span className={styles.metaValue}>{reportTo}</span>
                    {reportPhone ? (
                      <span className={styles.metaSub}>{reportPhone}</span>
                    ) : null}
                  </div>
                  <div>
                    <span className={styles.metaLabel}>Branch phone</span>
                    <span className={styles.metaValue}>
                      {job.branchPhoneNumber ?? "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={styles.muted}>No contact details available.</p>
              )}
            </section> */}
          </div>
        </div>
      </div>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </main>
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
