"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/components/profile/ProfileHeader";
import JobCard from "@/components/jobs/JobCard";
import Pagination from "@/components/jobs/Pagination";
import Toast from "@/components/jobs/Toast";
import { useJobs } from "@/hooks/useJobs";
import { useProfile } from "@/hooks/useProfile";
import { submitJobDecision } from "@/lib/api";
import type { Job, JobDecision } from "@/lib/types";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const pageSize = 10;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [undoJob, setUndoJob] = useState<{ job: Job; index: number } | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [visibleJobs, setVisibleJobs] = useState<Job[]>([]);
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    reload: reloadProfile,
  } = useProfile();
  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
    page,
    totalPages,
    setPage,
    reload: reloadJobs,
    submitting,
    setSubmitting,
  } = useJobs(profile?.maxJobDistance);

  const jobs = useMemo(() => jobsData?.jobs ?? [], [jobsData]);

  useEffect(() => {
    setVisibleJobs(jobs);
    setUndoJob(null);
    setToast(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, [jobs]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (
    message: string,
    actionLabel?: string,
    onAction?: () => void,
    timeoutMs = 3500
  ) => {
    setToast({ message, actionLabel, onAction });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    if (!actionLabel) {
      toastTimerRef.current = setTimeout(() => setToast(null), timeoutMs);
    }
  };

  const restoreJob = (job: Job, index: number) => {
    setVisibleJobs((prev) => {
      if (prev.some((item) => item.id === job.id)) {
        return prev;
      }
      const next = [...prev];
      next.splice(index, 0, job);
      return next;
    });
  };

  const handleDecision = async (job: Job, decision: JobDecision) => {
    const index = visibleJobs.findIndex((item) => item.id === job.id);

    setVisibleJobs((prev) => prev.filter((item) => item.id !== job.id));
    setSubmitting((prev) => ({ ...prev, [job.id]: true }));

    try {
      await submitJobDecision(job.id, decision);

      if (decision === "accepted") {
        showToast(`Accepted ${job.title}.`);
      } else {
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current);
        }
        setUndoJob({ job, index });
        showToast("Removed. Undo", "Undo", () => handleUndo(job.id), 5000);
        undoTimerRef.current = setTimeout(() => {
          setUndoJob(null);
          setToast(null);
        }, 5000);
      }
    } catch (error) {
      restoreJob(job, index);
      setUndoJob(null);
      showToast("Unable to update decision. Please try again.");
    } finally {
      setSubmitting((prev) => ({ ...prev, [job.id]: false }));
    }
  };

  const handleUndo = (jobId: string) => {
    if (!undoJob || undoJob.job.id !== jobId) {
      return;
    }
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    restoreJob(undoJob.job, undoJob.index);
    setUndoJob(null);
    setToast(null);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div>
            <h1 className={styles.title}>Your latest job matches</h1>
            <p className={styles.subtitle}>
              Review your profile and decide which opportunities move forward.
            </p>
          </div>
        </header>

        <div className={styles.body}>
          <aside className={styles.sidebar}>
            <ProfileHeader
              profile={profile}
              isLoading={profileLoading}
              error={profileError}
              onRetry={reloadProfile}
            />
          </aside>

          <section className={styles.feed}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Matched Jobs</h2>
              {jobsData?.total ? (
                <span className={styles.countBadge}>
                  {jobsData.total} matches
                </span>
              ) : null}
            </div>

            {jobsError ? (
              <div className={styles.errorCard} role="alert">
                <div>
                  <h3>We couldn&apos;t load matches.</h3>
                  <p>{jobsError}</p>
                </div>
                <button className={styles.retryButton} onClick={reloadJobs}>
                  Try again
                </button>
              </div>
            ) : null}

            <div className={styles.cards}>
              {jobsLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className={`${styles.cardSkeleton} skeleton`}
                    />
                  ))
                : visibleJobs.map((job) => {
                    const isSubmitting = submitting[job.id] ?? false;

                    return (
                      <JobCard
                        key={job.id}
                        job={job}
                        isSubmitting={isSubmitting}
                        isPreview={false}
                        onAccept={() => handleDecision(job, "accepted")}
                        onReject={() => handleDecision(job, "rejected")}
                        onOpen={() => router.push(`/jobs/${job.id}`)}
                      />
                    );
                  })}
            </div>

            {!jobsLoading && visibleJobs.length === 0 && !jobsError ? (
              <div className={styles.emptyState}>
                <h3>No matches yet</h3>
                <p>Check back soon for fresh opportunities.</p>
              </div>
            ) : null}

            {jobsData ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={jobsData.total}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            ) : null}
          </section>
        </div>
      </div>
      {toast ? (
        <Toast
          message={toast.message}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          onClose={() => setToast(null)}
        />
      ) : null}
    </main>
  );
}
