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
  const visiblePages = Math.min(3, totalPages);
  const pages = Array.from({ length: visiblePages }, (_, index) => index + 1);

  return (
    <div className={styles.pagination}>
      <div className={styles.pageList} role="list">
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            role="listitem"
            className={`${styles.pagePill} ${
              pageNumber === page ? styles.pagePillActive : ""
            }`}
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === page ? "page" : undefined}
          >
            {pageNumber}
          </button>
        ))}
      </div>
    </div>
  );
}
