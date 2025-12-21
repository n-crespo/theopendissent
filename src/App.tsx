import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { PostInput } from "./components/PostInput";
import { PostList } from "./components/PostList";
import { GlobalModal } from "./components/modals/GlobalModal";
import { Footer } from "./components/Footer";

export default function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // handle scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="app-root">
      <Header />
      <main id="body-content">
        <div id="center-container">
          <PostInput />
          <PostList />
        </div>
      </main>

      <button
        className={`back-to-top ${showScrollTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <i className="bi bi-arrow-up-short"></i>
      </button>

      {/* handles all popups */}
      <GlobalModal />

      <Footer />
    </div>
  );
}
