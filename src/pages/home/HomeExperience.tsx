import { homeExperience } from "@/content/site/homeExperience";
import { originalHref } from "@/shared/utils/originalPaths";
import styles from "./HomeExperience.module.css";

/** WHAT: Home career content reusing Education's white layout and type,
 * with the user-selected subtle company border.
 * WHY: Keep the existing visual hierarchy without photos, a second design system,
 * or oversized metric panels. The original Education and carousel stay intact.
 */
export function HomeExperience() {
  return (
    <section
      id="history"
      className={styles.section}
      aria-labelledby="experience-title"
    >
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>{homeExperience.eyebrow}</p>
          <h2 id="experience-title">{homeExperience.title}</h2>
          <p className={styles.summary}>{homeExperience.summary}</p>
          <div className={styles.actions} data-home-experience-actions>
            <a className={styles.careerLink} href={originalHref("career.html")}>
              {homeExperience.careerLabel}
              <span aria-hidden="true">↗</span>
            </a>
            <a
              className={styles.careerLink}
              href={originalHref("projects.html")}
            >
              {homeExperience.productsLabel}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className={styles.careers}>
          {homeExperience.items.map((item) => (
            <article
              key={item.id}
              className={styles.career}
              data-home-company={item.id}
            >
              <p className={styles.dates}>{item.dates}</p>
              <h3>{item.company}</h3>
              <p className={styles.role}>{item.role}</p>
              <h4 className={styles.label}>{homeExperience.productsLabel}</h4>
              <ul className={styles.products} data-home-products>
                {item.products.map((product) => (
                  <li key={product}>{product}</li>
                ))}
              </ul>
              <h4 className={styles.label}>{homeExperience.outcomesLabel}</h4>
              <ul className={styles.outcomes} data-home-outcomes>
                {item.outcomes.map((outcome) => (
                  <li key={outcome.text} data-product={outcome.product}>
                    {"sourceUrl" in outcome ? (
                      <a
                        href={outcome.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${outcome.product}: ${outcome.text}`}
                      >
                        {outcome.text}
                      </a>
                    ) : (
                      outcome.text
                    )}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
