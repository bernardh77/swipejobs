import { useCallback, useEffect, useState } from "react";
import { fetchProfile, getErrorMessage } from "@/lib/api";
import type { WorkerProfile } from "@/lib/types";

export function useProfile() {
  const [data, setData] = useState<WorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await fetchProfile();
      setData(profile);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadProfile().catch(() => {
      if (isMounted) {
        setError("Unable to load profile.");
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadProfile]);

  return {
    data,
    isLoading,
    error,
    reload: loadProfile,
  };
}
