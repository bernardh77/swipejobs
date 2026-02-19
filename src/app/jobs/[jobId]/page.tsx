"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toast from "@/components/jobs/Toast";
import JobDetailsPanel from "@/components/jobs/JobDetailsPanel";
import {
  getMatches,
  getWorker,
  mapMatchToJob,
  submitJobDecision,
  WORKER_ID,
} from "@/lib/api";
import type { Job, ProfileResponse } from "@/lib/types";
import styles from "./page.module.css";

type JobDetailsState = {
  job: Job | null;
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

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [worker, matches] = await Promise.all([
          getWorker(WORKER_ID),
          getMatches(WORKER_ID),
        ]);
        const mappedJobs = matches.map((match, index) =>
          mapMatchToJob(match, index)
        );
        const job = mappedJobs.find((match) => match.id === params.jobId) ?? null;
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
      await submitJobDecision(state.job.id, decision);
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

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Back to matches
        </Link>
        <JobDetailsPanel
          job={job}
          maxDistance={worker?.maxJobDistance}
          isSubmitting={isSubmitting}
          onAccept={() => handleDecision("accepted")}
          onReject={() => handleDecision("rejected")}
        />
      </div>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </main>
  );
}
