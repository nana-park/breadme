import { homeContent } from "@/content/site/homeContent";
import { siteMetadata } from "@/content/site/siteMetadata";
import { common } from "@/locales/ko/common";
import { Container } from "@/shared/layout/Container/Container";
import { ActionLink } from "@/shared/ui/ActionLink/ActionLink";
import { SectionTitle } from "@/shared/ui/SectionTitle/SectionTitle";
import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <Container>
      {/* 01. Overview — WHAT: Preserve the source hero and expose the preview's limits. */}
      <section
        id="overview"
        tabIndex={-1}
        aria-labelledby="hero-title"
        className={styles.hero}
      >
        <div className={styles.heroContent}>
          <p className={styles.role} lang="en">
            {homeContent.hero.role}
          </p>
          <h1 id="hero-title" lang="en">
            {homeContent.hero.title}
          </h1>
          <p className={styles.subtitle} lang="en">
            {homeContent.hero.subtitle}
          </p>
          <div className={styles.actions}>
            <ActionLink href="#projects">{common.exploreProjects}</ActionLink>
            <ActionLink
              variant="secondary"
              href={siteMetadata.originalPortfolioUrl}
            >
              {common.visitOriginal}
            </ActionLink>
          </div>
        </div>
        <aside className={styles.previewNotice} aria-labelledby="preview-title">
          <p className={styles.previewLabel}>
            <span className={styles.statusDot} aria-hidden="true" />
            {homeContent.preview.label}
          </p>
          <h2 id="preview-title">{homeContent.preview.title}</h2>
          <p>{homeContent.preview.description}</p>
        </aside>
      </section>

      {/* 02. Projects — WHAT: Validate the reading order without inventing project results. */}
      <section
        id="projects"
        tabIndex={-1}
        aria-labelledby="projects-title"
        className={styles.projects}
      >
        <div className={styles.sectionHeader}>
          <SectionTitle id="projects-title" {...homeContent.projects} />
          <span className={styles.status}>{homeContent.projects.status}</span>
        </div>
        <ol className={styles.projectGrid}>
          {homeContent.projects.items.map((item) => (
            <li key={item.id} className={styles.projectCard}>
              <span className={styles.cardNumber} aria-hidden="true">
                {item.number}
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 03. Contact — WHAT: Give both viewport sizes the same working next step. */}
      <section
        id="contact"
        tabIndex={-1}
        aria-labelledby="contact-title"
        className={styles.contact}
      >
        <SectionTitle id="contact-title" {...homeContent.contact} />
        <div className={styles.contactAction}>
          <ActionLink href={siteMetadata.originalPortfolioUrl}>
            {common.visitOriginal}
          </ActionLink>
        </div>
      </section>
    </Container>
  );
}
