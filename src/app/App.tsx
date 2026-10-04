import { useLayoutEffect } from "react";
import { Header } from "@/shared/layout/Header/Header";
import { Footer } from "@/shared/layout/Footer/Footer";
import { HomePage } from "@/pages/home/HomePage";
import { common } from "@/locales/ko/common";

export function App() {
  useLayoutEffect(() => {
    // WHY: On a direct hash URL React inserts the section after native fragment lookup.
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);

  return (
    <>
      <a className="skipLink" href="#main-content">
        {common.skipToContent}
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <HomePage />
      </main>
      <Footer />
    </>
  );
}
