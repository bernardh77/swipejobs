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
import { submitJobDecision, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/jobs/ToastProvider";
import { useMatchesData } from "@/hooks/useMatchesData";
import AcceptModal from "@/components/jobs/AcceptModal";
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
  const [acceptModalJob, setAcceptModalJob] = useState<Job | null>(null);
  const [acceptModalError, setAcceptModalError] = useState<string | null>(null);
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);
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
        const errorMessage = getErrorMessage(error);
        const isUnavailable =
          errorMessage.toLowerCase().includes("no longer available") ||
          errorMessage.toLowerCase().includes("fail-101");

        if (isUnavailable) {
          if (decision === "rejected") {
            updateToast(toastId, {
              message: "This job was already taken and is no longer available.",
              actionLabel: undefined,
              onAction: undefined,
              dismissAfterMs: 3 * 1000,
            });
          } else {
            // For accept, we ALSO do not restore the job to the UI since it's permanently gone
            updateToast(toastId, {
              message:
                "This position is no longer available. We've removed it from your matches.",
              actionLabel: undefined,
              onAction: undefined,
              dismissAfterMs: 4 * 1000,
            });
          }
        } else {
          // Routine API failure (e.g., 500 error), restore the job so they can try again
          const pending = pendingRef.current[jobId];
          if (pending) {
            restoreJob(pending.job, pending.originalIndex);
          }
          updateToast(toastId, {
            message: errorMessage,
            actionLabel: undefined,
            onAction: undefined,
            dismissAfterMs: 3 * 1000,
          });
        }
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

      if (decision === "accepted") {
        setAcceptModalError(null);
        setAcceptModalJob(visibleJobs[jobIndex]);
        return;
      }

      const job = visibleJobs[jobIndex];
      setVisibleJobs((current) => current.filter((item) => item.id !== jobId));
      const toastId = showToast({
        message: "Marked as not interested",
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

  const confirmAccept = useCallback(async () => {
    if (!acceptModalJob) return;
    const jobId = acceptModalJob.id;

    setIsSubmittingAccept(true);

    try {
      await submitJobDecision(jobId, "accepted");
      
      setAcceptModalJob(null);
      setAcceptModalError(null);
      setVisibleJobs((current) => current.filter((item) => item.id !== jobId));
      
      showToast({
        message: "Accepted",
        dismissAfterMs: 2.5 * 1000,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const isUnavailable =
        errorMessage.toLowerCase().includes("no longer available") ||
        errorMessage.toLowerCase().includes("fail-101");

      if (isUnavailable) {
        // Remove from background list so routing advances, but KEEP modal open!
        setVisibleJobs((current) => current.filter((item) => item.id !== jobId));
        setAcceptModalError("It was filled before your confirmation could be completed.");
      } else {
        setAcceptModalJob(null);
        setAcceptModalError(null);
        showToast({
          message: errorMessage,
          dismissAfterMs: 3 * 1000,
        });
      }
    } finally {
      setIsSubmittingAccept(false);
    }
  }, [acceptModalJob, showToast]);

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
      <AcceptModal 
        job={acceptModalJob}
        isOpen={!!acceptModalJob}
        isSubmitting={isSubmittingAccept}
        error={acceptModalError}
        onConfirm={confirmAccept}
        onCancel={() => {
          if (!isSubmittingAccept) {
            setAcceptModalJob(null);
            setAcceptModalError(null);
          }
        }}
      />
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
