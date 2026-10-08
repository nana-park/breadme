import {
  landingHeroes,
  type LandingHeroPage,
} from "@/content/original/landingHeroes";
import { assetUrl } from "@/shared/utils/originalPaths";
import styles from "./LandingPhotoHero.module.css";

/** WHAT: Editorial landing pages reuse Contact's photo-and-copy hierarchy.
 * WHY: Keep desktop centered; only mobile adopts Contact's left-aligned column. */
export function LandingPhotoHero({ page }: { page: LandingHeroPage }) {
  const content = landingHeroes[page];
  return (
    <div className={styles.hero} data-landing-photo-hero={page}>
      <img
        className={styles.photo}
        src={assetUrl(content.image)}
        alt={content.imageAlt}
        fetchPriority="high"
      />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.content}>
        <h1 className={styles.title}>{content.title}</h1>
        <div className={styles.copy}>
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
