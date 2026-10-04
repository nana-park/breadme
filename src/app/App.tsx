import { Header } from "@/shared/layout/Header/Header";
import { Footer } from "@/shared/layout/Footer/Footer";
import { HomePage } from "@/pages/home/HomePage";
import { common } from "@/locales/ko/common";

export function App() {
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
