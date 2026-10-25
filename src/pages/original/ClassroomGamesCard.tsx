import styles from './ClassroomGamesCard.module.css';

const classroomGamesUrl = 'https://nana-park.github.io/product-thinking-classroom-games/';

export function ClassroomGamesCard() {
  return (
    <article id="classroom-games" className={styles.card}>
      <a href={classroomGamesUrl} className={styles.thumbnail} aria-label="Explore Product Thinking: Classroom Games">
        <img src={`${import.meta.env.BASE_URL}images/classroom-games-live.png`} alt="Product Thinking: Classroom Games website with its interactive workshop games" loading="lazy" width="1440" height="900" />
      </a>
      <div className={styles.content}>
        <h2>Product Thinking: Classroom Games</h2>
        <p className={styles.meta}>Interactive workshop tools</p>
        <p>Games I built for product planning workshops, exploring human–AI teamwork, customer priorities, and task dependencies.</p>
        <p>Explore Together, Kitchen, Strategy Lab, and Duorun through games, walkthroughs, and rules.</p>
        <a href={classroomGamesUrl} className={styles.link}>Explore Classroom Games <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  );
}
