import styles from "@/app/page.module.css";

export default function MatchDetailsLoading() {
  return <div className={`${styles.detailSkeleton} skeleton`} />;
}
