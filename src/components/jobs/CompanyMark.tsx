"use client";

import styles from "./CompanyMark.module.css";

type CompanyMarkProps = {
  company: string;
  title: string;
};

const getInitials = (value: string) => {
  const parts = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("");
};

export default function CompanyMark({ company, title }: CompanyMarkProps) {
  const initials = getInitials(company) || getInitials(title);

  if (!initials) {
    return (
      <div className={styles.mark} aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 7.5V6.8C7 5.25 8.25 4 9.8 4h4.4C15.75 4 17 5.25 17 6.8v.7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <rect
            x="3.5"
            y="7.5"
            width="17"
            height="12"
            rx="2.2"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M3.5 12h17"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </div>
    );
  }

  return <div className={styles.mark}>{initials}</div>;
}
