import {
  researchSections,
  type ResearchPublication,
} from "@/content/research/publications";
import { assetUrl } from "@/shared/utils/originalPaths";
import styles from "./ResearchSections.module.css";

/** The original compact publication row language with explicit reviewed groups.
 * Unknown metadata is omitted rather than replaced by invented copy or actions. */
function Publication({ item }: { item: ResearchPublication }) {
  const indexed = item.kind === "journal" && item.index;
  const hasDetails = Boolean(item.description || item.links.length);
  return (
    <article
      data-research-paper={item.id}
      data-research-kind={item.kind}
      className={styles.row}
    >
      <div
        className={styles.dateColumn}
        data-research-date-column={indexed ? "" : undefined}
      >
        <span
          className={styles.date}
          data-research-status={item.status ? "" : undefined}
        >
          {item.date ?? item.status}
        </span>
      </div>
      <div
        className={`${styles.titleColumn} ${hasDetails ? styles.withDetails : styles.withoutDetails}`}
      >
        {indexed && (
          <div data-research-meta="">
            <span
              data-research-index={item.index}
              title={`Journal index: ${item.index}`}
            >
              {item.index}
            </span>
            <span data-research-mobile-date="" className={styles.date}>
              {item.date}
            </span>
          </div>
        )}
        <h3 className={styles.paperTitle}>{item.title}</h3>
        <p
          className={`${styles.venue} ${item.topics.length ? styles.withTopics : ""}`}
        >
          <span className={styles.venueText}>{item.venue}</span>
        </p>
        {item.topics.length > 0 && (
          <div className={styles.topics} data-research-topics="">
            {item.topics.map((topic) => (
              <span key={topic} className={styles.topic}>
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
      {hasDetails && (
        <div className={styles.details} data-research-details="">
          {item.description && (
            <p className={styles.description}>{item.description}</p>
          )}
          {item.links.length > 0 && (
            <div className={styles.actions} data-research-actions="">
              {item.links.map((link) => (
                <a
                  key={link.href}
                  href={link.asset ? assetUrl(link.href) : link.href}
                  target="_blank"
                  className={styles.action}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function ResearchSections() {
  return (
    <div className={styles.sections} data-research-sections="">
      {researchSections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className={styles.section}
          data-research-section={section.kind}
          aria-labelledby={`${section.id}-title`}
        >
          <header className={styles.header} data-research-section-header="">
            <h2 id={`${section.id}-title`} className={styles.title}>
              {section.title}
            </h2>
          </header>
          <div className={styles.list} data-research-list={section.kind}>
            {section.publications.map((item) => (
              <Publication key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
