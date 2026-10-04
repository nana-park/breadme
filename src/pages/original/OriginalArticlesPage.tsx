import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  originalArticles,
  type OriginalArticle,
} from "@/content/original/articles";
import { articlesPageContent as content } from "@/content/original/articles/pageContent";
import { assetUrl } from "@/shared/utils/originalPaths";

const ARTICLES_PER_PAGE = 3;
const LIST_SCROLL_OFFSET = 150;
const SCROLL_STORAGE_KEY = "articlesScrollY";

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
function currentHash() {
  return window.location.hash;
}
function articleIdFromHash(hash: string) {
  const [section, query] = hash.slice(1).split("?");
  return section === "article-detail"
    ? new URLSearchParams(query).get("id")
    : null;
}
function displayDate(date: string) {
  const [year, month] = date.split(".");
  if (!month) return date;
  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString(
    "en-US",
    {
      month: "long",
    },
  );
  return `${monthName} ${year}`;
}
function rememberedScroll() {
  try {
    const value = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    return value === null ? null : Number(value);
  } catch {
    return null;
  }
}

/**
 * WHAT: Original Articles hero, paginated archive, and hash-addressable reading view.
 * WHY: React owns navigation and scroll restoration without legacy DOM replacement.
 * DESIGN-EXCEPTION: Preserve the approved source classes, dimensions, and colors;
 * the shared foundation components are intentionally not substituted here.
 */
export function OriginalArticlesPage() {
  const hash = useSyncExternalStore(
    subscribeToHash,
    currentHash,
    () => "#articles",
  );
  const [page, setPage] = useState(1);
  const list = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const previousArticle = useRef<string | null>(null);
  const scrollBeforeReading = useRef<number | null>(null);
  const openedArticle = useRef<string | null>(null);
  const listLinks = useRef(new Map<string, HTMLAnchorElement>());
  const selectedArticle = originalArticles.find(
    (article) => article.id === articleIdFromHash(hash),
  );
  const selectedId = selectedArticle?.id ?? null;
  const totalPages = Math.ceil(originalArticles.length / ARTICLES_PER_PAGE);
  const visibleArticles = originalArticles.slice(
    (page - 1) * ARTICLES_PER_PAGE,
    page * ARTICLES_PER_PAGE,
  );
  const lastPage = Math.min(totalPages, Math.max(1, page - 2) + 4);
  const firstPage = Math.max(1, lastPage - 4);
  const pageNumbers = Array.from(
    { length: lastPage - firstPage + 1 },
    (_, index) => firstPage + index,
  );

  useLayoutEffect(() => {
    if (selectedId === previousArticle.current) return;
    if (selectedId) {
      window.scrollTo(0, 0);
      title.current?.focus({ preventScroll: true });
    } else if (previousArticle.current) {
      const savedScroll = scrollBeforeReading.current ?? rememberedScroll();
      const restoredScroll =
        savedScroll !== null && Number.isFinite(savedScroll) ? savedScroll : 0;
      window.scrollTo(0, restoredScroll);
      const returningTo = openedArticle.current;
      if (returningTo)
        listLinks.current.get(returningTo)?.focus({ preventScroll: true });
      try {
        sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      } catch {
        // WHY: In-memory restoration still works when browser storage is unavailable.
      }
    }
    previousArticle.current = selectedId;
  }, [selectedId]);

  function rememberListPosition(article: OriginalArticle) {
    openedArticle.current = article.id;
    scrollBeforeReading.current = window.scrollY;
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
    } catch {
      // WHY: Storage may be disabled; the ref above is sufficient within this visit.
    }
  }
  function changePage(nextPage: number) {
    setPage(Math.min(totalPages, Math.max(1, nextPage)));
    if (list.current) {
      const top =
        list.current.getBoundingClientRect().top +
        window.scrollY -
        LIST_SCROLL_OFFSET;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }
  function backToList() {
    window.location.hash = "#articles";
  }

  return (
    <>
      {/* WHAT: Original archive remains mounted to preserve pagination and return focus. */}
      <section
        className="pb-24 bg-white"
        id="articles"
        style={{
          paddingTop: "12rem",
          display: selectedArticle ? "none" : undefined,
        }}
      >
        <div className="container mx-auto px-4 lg:px-12 max-w-[1400px]">
          <div className="flex flex-col items-center mb-24 mx-auto text-center">
            <h2 className="font-sans tracking-tight text-zinc-900 text-[32px] md:text-[44px] leading-[1.1] font-normal mb-4">
              {content.heading[0]} <br />
              {content.heading[1]}
            </h2>
            <p className="font-sans text-zinc-600 text-[14px] md:text-[15px] font-normal mb-16">
              {content.introduction}
            </p>
            <div className="w-full aspect-[16/7] bg-zinc-100 rounded-none overflow-hidden mb-16 relative shadow-sm">
              <img
                src={assetUrl(content.image)}
                alt={content.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-sans tracking-tight text-zinc-900 text-[18px] md:text-[22px] font-normal mb-1.5">
              {content.subheading}
            </h3>
            <p className="font-sans text-zinc-600 text-[15px] md:text-[17px] font-light">
              {content.description}
            </p>
          </div>
          <div className="max-w-[1200px] mx-auto">
            <div
              ref={list}
              id="articles-list-container"
              className="flex flex-col border-t border-gray-200"
            >
              <div className="flex flex-col min-h-[750px] lg:min-h-[550px]">
                {visibleArticles.map((article) => (
                  <div
                    key={article.id}
                    className="py-8 px-4 lg:px-8 border-b border-gray-200 flex flex-col lg:flex-row gap-4 lg:gap-8 hover:bg-gray-50 transition-colors"
                  >
                    <div className="lg:w-1/6 shrink-0 mt-0.5">
                      <span className="font-sans text-zinc-500 text-[12px] font-medium">
                        {displayDate(article.date)}
                      </span>
                    </div>
                    <div className="lg:w-3/6 shrink-0 flex flex-col justify-start">
                      <h3 className="font-sans text-[16px] md:text-[18px] font-medium text-zinc-900 tracking-tight mb-2 leading-snug">
                        {article.title}
                      </h3>
                      <p className="font-sans text-zinc-600 text-[13px] leading-relaxed mb-4">
                        {article.excerpt}
                      </p>
                    </div>
                    <div className="lg:w-2/6 flex flex-col md:flex-row md:items-center justify-end gap-4">
                      <a
                        ref={(element) => {
                          if (element)
                            listLinks.current.set(article.id, element);
                          else listLinks.current.delete(article.id);
                        }}
                        href={`#article-detail?id=${article.id}`}
                        onClick={() => rememberListPosition(article)}
                        aria-label={`${content.readArticle}: ${article.title}`}
                        className="shrink-0 px-5 py-2 rounded-full border border-gray-300 font-sans text-[12px] font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors whitespace-nowrap"
                      >
                        {content.readArticle}
                      </a>
                    </div>
                  </div>
                ))}
                {visibleArticles.length === 0 && (
                  <div className="py-8 px-4 lg:px-8 text-center text-zinc-500 font-sans text-sm">
                    {content.empty}
                  </div>
                )}
              </div>
              {totalPages > 1 && (
                <nav
                  aria-label="Articles pagination"
                  className="flex justify-center items-center gap-2 mt-12 mb-8 font-sans"
                >
                  <button
                    type="button"
                    aria-label="Previous articles page"
                    onClick={() => changePage(page - 1)}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Chevron direction="left" className="w-4 h-4 ml-[-1px]" />
                  </button>
                  {pageNumbers.map((number) => (
                    <button
                      key={number}
                      type="button"
                      aria-label={`Articles page ${number}`}
                      aria-current={number === page ? "page" : undefined}
                      onClick={() => {
                        if (number !== page) changePage(number);
                      }}
                      className={
                        number === page
                          ? "w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-white text-[13px] font-medium"
                          : "w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-gray-100 text-[13px] font-medium transition-colors"
                      }
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Next articles page"
                    onClick={() => changePage(page + 1)}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Chevron direction="right" className="w-4 h-4 ml-[1px]" />
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* WHAT: Hash-addressable original article reading layout and source link. */}
      {selectedArticle && (
        <section
          className="pb-24 bg-white"
          id="article-detail"
          style={{ paddingTop: "12rem" }}
        >
          <div className="container mx-auto px-4 lg:px-12 max-w-[800px]">
            <button
              type="button"
              onClick={backToList}
              className="mb-8 px-5 py-2 border border-gray-300 rounded-full hover:bg-zinc-100 text-[13px] text-zinc-600 hover:text-zinc-900 font-sans font-semibold transition-colors inline-flex items-center gap-2 group"
            >
              <Chevron
                direction="left"
                className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1"
              />
              {content.backToList}
            </button>
            <h2
              ref={title}
              tabIndex={-1}
              id="article-detail-title"
              className="font-sans text-zinc-900 text-[28px] md:text-[36px] font-medium tracking-tight mb-4 leading-tight"
            >
              {selectedArticle.title}
            </h2>
            <div
              id="article-detail-meta"
              className="font-sans text-zinc-500 text-[14px] mb-12 pb-6 border-b border-gray-200"
            >
              {content.publishedOn}
              {selectedArticle.date}
            </div>
            <div
              id="article-detail-content"
              className="font-sans text-zinc-700 text-[16px] leading-[1.8] space-y-6"
            >
              <selectedArticle.Body />
            </div>
            <div className="mt-16 pt-8 border-t border-gray-200 flex justify-center gap-4 items-center font-sans">
              <button
                type="button"
                onClick={backToList}
                className="px-5 py-2.5 bg-zinc-100 rounded-full hover:bg-zinc-200 text-[13px] text-zinc-700 font-semibold transition-colors inline-flex items-center gap-2 group"
              >
                <Chevron
                  direction="left"
                  className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1"
                />
                {content.backToList}
              </button>
              <a
                id="article-original-link"
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#d97706] text-white rounded-full hover:bg-[#b46305] text-[13px] font-semibold transition-colors inline-flex items-center gap-2 group"
              >
                {content.viewOriginal}
                <svg
                  aria-hidden="true"
                  className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-[1px] group-hover:translate-x-[1px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Chevron({
  direction,
  className,
}: {
  direction: "left" | "right";
  className: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
      />
    </svg>
  );
}
