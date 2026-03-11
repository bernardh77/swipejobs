import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage, getMatches, getWorker, mapMatchToJob, WORKER_ID } from "@/lib/api";
import type { Job, ProfileResponse } from "@/lib/types";

type MatchesData = {
  worker: ProfileResponse | null;
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
};

export function useMatchesData(): MatchesData {
  const workerQuery = useQuery({
    queryKey: ["worker", WORKER_ID],
    queryFn: () => getWorker(WORKER_ID),
  });

  const maxDistance = workerQuery.data?.maxJobDistance;

  // We wrap the select function in useCallback so React
  // doesn't recreate this math function on every render.
  const selectMatches = useCallback((matchesData: any[]) => {
    const mapped = matchesData.map((match, index) =>
      mapMatchToJob(match, index)
    );

    if (typeof maxDistance !== "number") {
      return mapped;
    }

    return mapped.filter((job) => {
      if (typeof job.distanceMiles !== "number") {
        return true;
      }
      return job.distanceMiles <= maxDistance;
    });
  }, [maxDistance]); // <-- It will ONLY recreate this function if the user changes distance!

  const matchesQuery = useQuery({
    queryKey: ["matches", WORKER_ID],
    queryFn: () => getMatches(WORKER_ID),
    select: selectMatches, // <-- Use the memoized function here!
  });

  // --- PREVIOUS IMPLEMENTATION USING useMemo (Commented out for reference) ---
  /*
  const matchesQuery = useQuery({
    queryKey: ["matches", WORKER_ID],
    queryFn: () => getMatches(WORKER_ID),
  });

  const jobs = useMemo(() => {
    if (!matchesQuery.data) {
      return [];
    }
    const mapped = matchesQuery.data.map((match, index) =>
      mapMatchToJob(match, index)
    );
    const maxDistance = workerQuery.data?.maxJobDistance;
    if (typeof maxDistance !== "number") {
      return mapped;
    }
    return mapped.filter((job) => {
      if (typeof job.distanceMiles !== "number") {
        return true;
      }
      return job.distanceMiles <= maxDistance;
    });
  }, [matchesQuery.data, workerQuery.data]);
  */

  const error =
    (workerQuery.error && getErrorMessage(workerQuery.error)) ||
    (matchesQuery.error && getErrorMessage(matchesQuery.error)) ||
    null;

  return {
    worker: workerQuery.data ?? null,
    jobs: matchesQuery.data ?? [], // <-- Matches query now returns perfectly clean Job[] directly!
    isLoading: workerQuery.isLoading || matchesQuery.isLoading,
    error,
  };
}
