import type { ReactNode } from "react";
import styles from "./ActionLink.module.css";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
};
export function ActionLink({ href, children, variant = "primary" }: Props) {
  return (
    <a className={`${styles.actionLink} ${styles[variant]}`} href={href}>
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
