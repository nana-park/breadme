import { homeCapabilities } from "@/content/site/homeCapabilities";
import { originalHref } from "@/shared/utils/originalPaths";
import styles from "./HomeCapabilities.module.css";

/** WHAT: A concise product-focused next step inside the existing Home CTA box. */
export function HomeCapabilities() {
  return (
    <div className={styles.content} data-home-capabilities>
      <h2>{homeCapabilities.title}</h2>
      <p className={styles.introduction}>{homeCapabilities.introduction}</p>
      <div className={styles.groups}>
        {homeCapabilities.groups.map((group) => (
          <div className={styles.group} key={group.title}>
            <h3>{group.title}</h3>
            <p>{group.description}</p>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <a
          className={styles.productLink}
          href={originalHref(homeCapabilities.action.href)}
        >
          {homeCapabilities.action.label}
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
