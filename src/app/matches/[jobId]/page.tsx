"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import JobDetailsPanel from "@/components/jobs/JobDetailsPanel";
import { useJobActions } from "@/components/matches/JobActionsProvider";
import styles from "@/app/page.module.css";

export default function MatchDetailsPage({
  params,
}: {
  params: { jobId: string };
}) {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const {
    visibleJobs,
    worker,
    isLoading,
    error,
    pendingActions,
    scheduleDecision,
  } = useJobActions();
  const job = visibleJobs.find((item) => item.id === params.jobId) ?? null;
  const pendingDecision = job ? pendingActions[job.id]?.decision ?? null : null;
  const nextJobId = useMemo(() => {
    if (!job) {
      return null;
    }
    const index = visibleJobs.findIndex((item) => item.id === job.id);
    if (index === -1) {
      return null;
    }
    return (
      visibleJobs[index + 1]?.id ?? visibleJobs[index - 1]?.id ?? null
    );
  }, [job, visibleJobs]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!job && pendingActions[params.jobId]) {
      return;
    }
    if (!job && visibleJobs.length > 0) {
      router.replace(`/matches/${visibleJobs[0].id}`);
    } else if (!job && visibleJobs.length === 0) {
      router.replace("/matches");
    }
  }, [isLoading, job, pendingActions, params.jobId, router, visibleJobs]);

  if (isLoading) {
    return <div className={`${styles.detailSkeleton} skeleton`} />;
  }

  if (error || !job) {
    return (
      <div className={styles.detailEmpty}>
        <h3>Job not found</h3>
        <p>{error ?? "We couldn't find that job."}</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.backRow}>
        <Link href="/matches" className={styles.backLink}>
          ← Back to matches
        </Link>
      </div>
      <JobDetailsPanel
        job={job}
        maxDistance={worker?.maxJobDistance}
        pendingDecision={pendingDecision}
        onAccept={() => {
          scheduleDecision(job.id, "accepted");
          if (!isDesktop) {
            router.replace("/matches");
          } else if (nextJobId) {
            router.replace(`/matches/${nextJobId}`);
          } else {
            router.replace("/matches");
          }
        }}
        onReject={() => {
          scheduleDecision(job.id, "rejected");
          if (!isDesktop) {
            router.replace("/matches");
          } else if (nextJobId) {
            router.replace(`/matches/${nextJobId}`);
          } else {
            router.replace("/matches");
          }
        }}
      />
    </>
  );
}
