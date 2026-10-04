import { homeContent } from "@/content/site/homeContent";
import { common } from "@/locales/ko/common";
import { Container } from "@/shared/layout/Container/Container";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.footerContent}>
          <p>
            <span lang="en">{homeContent.name}</span> · {homeContent.footer}
          </p>
          <a href="#overview">
            {common.backToTop}
            <span aria-hidden="true"> ↑</span>
          </a>
        </div>
      </Container>
    </footer>
  );
}
