type Props = { onPending: () => void };
export function OriginalFooter({ onPending }: Props) {
  return (
    <footer className="footer" data-mobile-snap-section="footer">
      <div className="container footer-content">
        <div className="footer-columns">
          <div className="footer-col">
            <h4>Create</h4>
            <ul className="footer-links">
              <li>
                <a
                  href="https://www.artinsight.co.kr/news/search.php?search_type=&search_date=&section=&q=&q=%EB%B0%95%EB%82%98%ED%98%84&start_day=&end_day="
                  target="_blank"
                  rel="noreferrer"
                >
                  Critic &amp; Essay
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Learn</h4>
            <ul className="footer-links">
              <li>
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    onPending();
                  }}
                >
                  Interviews
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    onPending();
                  }}
                >
                  Seminars
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <div className="footer-socials-col">
              <a
                href="https://instagram.com/__breadme"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="social-icon"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Vision</h4>
            <div className="footer-socials-col">
              <a
                href="https://www.linkedin.com/in/%EB%82%98%ED%98%84-%EB%B0%95-08314925b/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="social-icon"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="mailto:breadme00@gmail.com"
                aria-label="Email"
                className="social-icon"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <div className="footer-lang">
            <button className="lang-btn active" aria-pressed="true">
              <span className="lang-dot" />
              English
            </button>
            <button className="lang-btn" onClick={onPending}>
              Korean
            </button>
          </div>
          <div className="footer-copyright">
            <p>© 2026 Nahyun Park</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
