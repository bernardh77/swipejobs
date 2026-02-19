import styles from "./Pagination.module.css";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const onPrev = () => onPageChange(Math.max(1, page - 1));
  const onNext = () => onPageChange(Math.min(totalPages, page + 1));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className={styles.pagination}>
      <button
        className={styles.button}
        onClick={onPrev}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        Prev
      </button>
      <span className={styles.pageIndicator}>
        Showing {start}–{end} of {totalItems}
      </span>
      <button
        className={styles.button}
        onClick={onNext}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}
