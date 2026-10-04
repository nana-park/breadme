import styles from "./SectionTitle.module.css";

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};
export function SectionTitle({ id, eyebrow, title, description }: Props) {
  return (
    <div className={styles.sectionTitle}>
      <p className={styles.eyebrow} lang="en">
        {eyebrow}
      </p>
      <h2 id={id}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
