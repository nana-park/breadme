import type { ReactNode } from 'react';
import styles from './LectureCategory.module.css';

/** Group existing lecture cards without hiding content behind tabs. */
export function LectureCategory({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section aria-labelledby={id} className={styles.category} data-lecture-category={id}>
    <h2 id={id} className={styles.title}>{title}</h2>
    {children}
  </section>;
}
