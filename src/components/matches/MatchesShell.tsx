"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  JobActionsProvider,
  useJobActions,
} from "@/components/matches/JobActionsProvider";
import MatchesList from "@/components/matches/MatchesList";
import styles from "@/app/page.module.css";

const DESKTOP_QUERY = "(min-width: 900px)";

type MatchesShellProps = {
  children?: React.ReactNode;
  mode?: "desktopSplit" | "mobileDetailsOnly";
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export default function MatchesShell({
  children,
  mode = "desktopSplit",
}: MatchesShellProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const params = useParams<{ jobId?: string }>();
  const router = useRouter();
  const hasJobId = Boolean(params?.jobId);
  const showList = isDesktop || !hasJobId;
  const showDetail = isDesktop || hasJobId;

  return (
    <JobActionsProvider>
      <MatchesShellContent
        isDesktop={isDesktop}
        hasJobId={hasJobId}
        onAutoSelect={(jobId) => router.replace(`/matches/${jobId}`)}
      >
        {children}
      </MatchesShellContent>
    </JobActionsProvider>
  );
}

function MatchesShellContent({
  isDesktop,
  hasJobId,
  onAutoSelect,
  children,
}: {
  isDesktop: boolean;
  hasJobId: boolean;
  onAutoSelect: (jobId: string) => void;
  children?: React.ReactNode;
}) {
  const { visibleJobs, isLoading } = useJobActions();

  useEffect(() => {
    if (!isDesktop || hasJobId || isLoading) {
      return;
    }
    if (visibleJobs.length > 0) {
      onAutoSelect(visibleJobs[0].id);
    }
  }, [isDesktop, hasJobId, isLoading, visibleJobs, onAutoSelect]);

  const showList = isDesktop || !hasJobId;
  const showDetail = isDesktop || hasJobId;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={`${styles.body} ${isDesktop ? styles.splitView : ""}`}>
          {showList ? (
            <div className={styles.leftPane}>
              <MatchesList />
            </div>
          ) : null}

          {showList && isDesktop ? (
            <div className={styles.divider} aria-hidden="true" />
          ) : null}

          {showDetail ? (
            <aside className={styles.detailPane}>{children}</aside>
          ) : null}
        </div>
      </div>
    </main>
  );
}
