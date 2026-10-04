import { homeHero } from "@/content/site/homeHero";
import { SplineHero } from "@/shared/ui/SplineHero/SplineHero";
import { originalHref } from "@/shared/utils/originalPaths";
import styles from "./HomeHero.module.css";

/** WHAT: The revised Home introduction, isolated from the other source pages.
 * WHY: Keep the original artwork and identity while making the role and next step clear.
 */
export function HomeHero() {
  return (
    <section id="home" className={styles.hero} aria-labelledby="home-title">
      <div className={styles.introduction}>
        <p className={styles.eyebrow}>{homeHero.eyebrow}</p>
        <h1 id="home-title" className={styles.title}>
          {homeHero.title}
        </h1>
      </div>
      <div className={styles.artworkStage} data-home-artwork>
        <SplineHero
          className={styles.artwork}
          style={{
            position: "relative",
            left: "auto",
            top: "auto",
            transform: "translateX(var(--home-artwork-offset, 0px))",
            width: "var(--home-artwork-width, 100%)",
            height: "100%",
          }}
        />
      </div>
      <div className={styles.description} data-home-description>
        <p className={styles.summary}>{homeHero.description}</p>
        <p className={styles.experience}>
          <span>{homeHero.experience}</span>
          <span className={styles.separator} aria-hidden="true">
            ·
          </span>
          <span>{homeHero.launchExperience}</span>
        </p>
      </div>
      <div className={styles.actions} data-home-actions>
        <a
          className={styles.primaryAction}
          href={originalHref("projects.html")}
        >
          <span>{homeHero.workLabel}</span>
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m9 5 7 7-7 7"
            />
          </svg>
        </a>
        <a
          className={styles.secondaryAction}
          href={originalHref("contact.html")}
        >
          <span>{homeHero.contactLabel}</span>
        </a>
      </div>
    </section>
  );
}
