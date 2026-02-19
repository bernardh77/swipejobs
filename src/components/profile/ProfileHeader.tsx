import type { WorkerProfile } from "@/lib/types";
import styles from "./ProfileHeader.module.css";

type ProfileHeaderProps = {
  profile: WorkerProfile | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function ProfileHeader({
  profile,
  isLoading,
  error,
  onRetry,
}: ProfileHeaderProps) {
  if (isLoading) {
    return (
      <div className={styles.card} aria-busy="true">
        <div className={`${styles.avatarSkeleton} skeleton`} />
        <div className={styles.content}>
          <div className={`${styles.line} skeleton`} />
          <div className={`${styles.subline} skeleton`} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorCard} role="alert">
        <div>
          <h3>Profile unavailable</h3>
          <p>{error}</p>
        </div>
        <button className={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className={styles.card}>
      <img
        src={profile.avatarUrl}
        alt={`${profile.name} avatar`}
        className={styles.avatar}
      />
      <div className={styles.content}>
        <h2 className={styles.name}>{profile.name}</h2>
        <p className={styles.location}>{profile.location}</p>
      </div>
    </div>
  );
}
