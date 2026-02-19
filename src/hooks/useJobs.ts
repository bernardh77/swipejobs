import { useCallback, useEffect, useState } from "react";
import { fetchJobs, getErrorMessage } from "@/lib/api";
import type { JobsResult, JobDecision } from "@/lib/types";

export function useJobs(maxDistance?: number) {
  const [data, setData] = useState<JobsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [decisions, setDecisions] = useState<Record<string, JobDecision>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchJobs(page, 10);
      if (typeof maxDistance === "number") {
        const filteredJobs = response.jobs.filter((job) => {
          if (typeof job.distanceMiles !== "number") {
            return true;
          }
          return job.distanceMiles <= maxDistance;
        });
        const total = filteredJobs.length;
        const totalPages = Math.max(1, Math.ceil(total / 10));
        setData({
          ...response,
          jobs: filteredJobs,
          total,
          totalPages,
        });
      } else {
        setData(response);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, maxDistance]);

  useEffect(() => {
    let isMounted = true;
    loadJobs().catch(() => {
      if (isMounted) {
        setError("Unable to load job matches.");
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadJobs]);

  const reload = useCallback(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    data,
    isLoading,
    error,
    page,
    totalPages: data?.totalPages ?? 1,
    setPage,
    reload,
    decisions,
    setDecisions,
    submitting,
    setSubmitting,
    actionErrors,
    setActionErrors,
  };
}
