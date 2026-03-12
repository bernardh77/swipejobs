"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { submitJobDecision } from "@/lib/api";
import { useToast } from "@/components/jobs/ToastProvider";
import { useMatchesData } from "@/hooks/useMatchesData";
import type { Job, JobDecision, ProfileResponse } from "@/lib/types";

type PendingAction = {
  decision: JobDecision;
  toastId: string;
  timeoutId: number;
  originalIndex: number;
  job: Job;
};

type JobActionsContextValue = {
  pendingActions: Record<string, PendingAction>;
  visibleJobs: Job[];
  worker: ProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  scheduleDecision: (jobId: string, decision: JobDecision) => void;
  undoDecision: (jobId: string) => void;
};

const JobActionsContext = createContext<JobActionsContextValue | null>(null);
const UNDO_WINDOW_MS = 3 * 1000;

export function JobActionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { jobs, worker, isLoading, error } = useMatchesData();
  const [visibleJobs, setVisibleJobs] = useState<Job[]>([]);
  const [pendingActions, setPendingActions] = useState<
    Record<string, PendingAction>
  >({});
  const pendingRef = useRef<Record<string, PendingAction>>({});
  const hasHydrated = useRef(false);
  const { showToast, updateToast, dismissToast } = useToast();

  const setPending = useCallback((next: Record<string, PendingAction>) => {
    pendingRef.current = next;
    setPendingActions(next);
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!hasHydrated.current) {
      setVisibleJobs(jobs);
      hasHydrated.current = true;
    }
  }, [isLoading, jobs]);

  const restoreJob = useCallback((job: Job, index: number) => {
    setVisibleJobs((current) => {
      const next = [...current];
      const safeIndex = Math.min(Math.max(index, 0), next.length);
      next.splice(safeIndex, 0, job);
      return next;
    });
  }, []);

  const undoDecision = useCallback(
    (jobId: string) => {
      const current = pendingRef.current[jobId];
      if (!current) {
        return;
      }
      window.clearTimeout(current.timeoutId);
      dismissToast(current.toastId);
      restoreJob(current.job, current.originalIndex);
      showToast({
        message: "Undone",
        dismissAfterMs: 1.5 * 1000,
      });
      const next = { ...pendingRef.current };
      delete next[jobId];
      setPending(next);
    },
    [dismissToast, restoreJob, setPending, showToast]
  );

  const finalizeDecision = useCallback(
    async (jobId: string, decision: JobDecision, toastId: string) => {
      try {
        await submitJobDecision(jobId, decision);
        updateToast(toastId, {
          message: decision === "accepted" ? "Accepted" : "Rejected",
          actionLabel: undefined,
          onAction: undefined,
          dismissAfterMs: 2.5 * 1000,
        });
      } catch (error) {
        const pending = pendingRef.current[jobId];
        if (pending) {
          restoreJob(pending.job, pending.originalIndex);
        }
        updateToast(toastId, {
          message: "Something went wrong. Please try again.",
          actionLabel: undefined,
          onAction: undefined,
          dismissAfterMs: 3 * 1000,
        });
      } finally {
        const next = { ...pendingRef.current };
        delete next[jobId];
        setPending(next);
      }
    },
    [restoreJob, setPending, updateToast]
  );

  const scheduleDecision = useCallback(
    (jobId: string, decision: JobDecision) => {
      if (pendingRef.current[jobId]) {
        return;
      }
      const jobIndex = visibleJobs.findIndex((item) => item.id === jobId);
      if (jobIndex === -1) {
        return;
      }
      const job = visibleJobs[jobIndex];
      setVisibleJobs((current) => current.filter((item) => item.id !== jobId));
      const toastId = showToast({
        message:
          decision === "accepted" ? "Accepted job" : "Marked as not interested",
        actionLabel: "Undo",
        onAction: () => undoDecision(jobId),
      });

      const timeoutId = window.setTimeout(() => {
        finalizeDecision(jobId, decision, toastId);
      }, UNDO_WINDOW_MS);

      const next = {
        ...pendingRef.current,
        [jobId]: { decision, toastId, timeoutId, originalIndex: jobIndex, job },
      };
      setPending(next);
    },
    [finalizeDecision, setPending, showToast, undoDecision, visibleJobs]
  );

  const value = useMemo(
    () => ({
      pendingActions,
      visibleJobs,
      worker,
      isLoading,
      error,
      scheduleDecision,
      undoDecision,
    }),
    [
      pendingActions,
      visibleJobs,
      worker,
      isLoading,
      error,
      scheduleDecision,
      undoDecision,
    ]
  );

  useEffect(() => {
    return () => {
      Object.values(pendingRef.current).forEach((pending) =>
        window.clearTimeout(pending.timeoutId)
      );
      pendingRef.current = {};
    };
  }, []);

  return (
    <JobActionsContext.Provider value={value}>
      {children}
    </JobActionsContext.Provider>
  );
}

export function useJobActions() {
  const context = useContext(JobActionsContext);
  if (!context) {
    throw new Error("useJobActions must be used within JobActionsProvider");
  }
  return context;
}
