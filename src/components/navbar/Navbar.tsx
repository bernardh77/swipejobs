"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { data, isLoading } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const fullName = data?.name ?? "Worker";
  const email = data?.email ?? "Email unavailable";
  const address = data?.location ?? "Location unavailable";
  const maxDistance = data?.maxJobDistance;
  const initials =
    data?.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "W";

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          swipejobs
        </Link>
        <div className={styles.profile} ref={popoverRef}>
          {isLoading ? (
            <div className={styles.skeletonWrap} aria-hidden="true">
              <div className={`${styles.avatarSkeleton} skeleton`} />
              <div className={`${styles.textSkeleton} skeleton`} />
            </div>
          ) : (
            <button
              className={styles.avatarButton}
              onClick={() => setIsOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-label="Open profile menu"
            >
              <span className={styles.avatar}>{initials}</span>
            </button>
          )}

          {isOpen ? (
            <div className={styles.popover} role="menu">
              <p className={styles.name}>{fullName}</p>
              <div className={styles.metaGroup}>
                <span className={styles.metaLabel}>Email</span>
                <span className={styles.metaValue}>{email}</span>
              </div>
              <div className={styles.metaGroup}>
                <span className={styles.metaLabel}>Address</span>
                <span className={styles.metaValue}>{address}</span>
              </div>
              <div className={styles.metaGroup}>
                <span className={styles.metaLabel}>Distance preference</span>
                <span className={styles.metaValue}>
                  {maxDistance ?? "—"} mi
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
