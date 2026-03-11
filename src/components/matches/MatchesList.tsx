"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import JobCard from "@/components/jobs/JobCard";
import Pagination from "@/components/jobs/Pagination";
import { useJobActions } from "@/components/matches/JobActionsProvider";
import type { Job } from "@/lib/types";
import styles from "@/app/page.module.css";

type MatchesListProps = {
  selectedJobId?: string;
  showHero?: boolean;
};

export default function MatchesList({
  selectedJobId,
  showHero = true,
}: MatchesListProps) {
  const params = useParams<{ jobId?: string }>();
  const { visibleJobs, isLoading, error, pendingActions } = useJobActions();
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const activeJobId = selectedJobId ?? params?.jobId ?? null;

  const start = (page - 1) * pageSize;
  const pagedJobs = visibleJobs.slice(start, start + pageSize);

  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / pageSize));

  // Visual-only duplication to preview denser lists.
  const multiplier = 1;
  const displayJobs = pagedJobs.length === 0 
    ? [] 
    : Array.from({ length: multiplier }, (_, index) =>
        pagedJobs.map((job) => ({
          job,
          key: `${job.id}-preview-${index}`,
        }))
      ).flat();

  const renderJobCard = (job: Job, key: string) => (
    <JobCard
      key={key}
      job={job}
      isSubmitting={false}
      isPreview={false}
      isSelected={activeJobId === job.id}
      pendingDecision={pendingActions[job.id]?.decision ?? null}
      variant="row"
      showActions={false}
      onAccept={() => undefined}
      onReject={() => undefined}
    />
  );

  return (
    <section className={styles.feed}>
      {showHero ? (
        <header className={styles.hero}>
          <div>
            <h1 className={styles.title}>Your latest job matches</h1>
            <p className={styles.subtitle}>
              Review your profile and decide which opportunities move forward.
            </p>
          </div>
        </header>
      ) : null}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Matched Jobs</h2>
        {visibleJobs.length ? (
          <span className={styles.countBadge}>{visibleJobs.length} matches</span>
        ) : null}
      </div>

      <div className={styles.listScroll}>
        {error ? (
          <div className={styles.errorCard} role="alert">
            <div>
              <h3>We couldn&apos;t load matches.</h3>
              <p>{error}</p>
            </div>
            <button className={styles.retryButton} onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : null}
        <div className={styles.listPanel}>
          <div className={styles.cards}>
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className={`${styles.cardSkeleton} skeleton`}
                  />
                ))
              : displayJobs.map(({ job, key }) => (
                  <Link
                    key={key}
                    href={`/matches/${job.id}`}
                    scroll={false}
                    className={styles.rowLink}
                  >
                    {renderJobCard(job, key)}
                  </Link>
                ))}
          </div>

          {!isLoading && visibleJobs.length === 0 && !error ? (
            <div className={styles.emptyState}>
              <h3>No matches yet</h3>
              <p>Check back soon for fresh opportunities.</p>
            </div>
          ) : null}

          {visibleJobs.length ? (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
