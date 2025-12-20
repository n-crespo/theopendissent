import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { PostInput } from "./components/PostInput";
import { PostList } from "./components/PostList";
import { SignInModal } from "./components/modals/SignInModal";
import { HelpModal } from "./components/modals/HelpModal";
import { useAuth } from "./hooks/useAuth";
import { usePosts } from "./hooks/usePosts";

export default function App() {
  const { user, signIn, logout } = useAuth();
  const { posts, loading, loadMore, currentLimit } = usePosts(20);
  const [activeModal, setActiveModal] = useState<"signin" | "help" | null>(
    null,
  );

  // state to show/hide the back-to-top button
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // show button if user scrolls down more than 400px
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeModals = () => setActiveModal(null);

  return (
    <div className="app-root">
      <Header
        user={user}
        onOpenHelp={() => setActiveModal("help")}
        onOpenSignIn={() => setActiveModal("signin")}
        onLogout={logout}
      />

      <main id="body-content">
        <div id="center-container">
          <PostInput
            user={user}
            onRequireAuth={() => setActiveModal("signin")}
          />

          <PostList
            posts={posts}
            currentUser={user}
            onRequireAuth={() => setActiveModal("signin")}
            loadMore={loadMore}
            isLoading={loading}
            hasMore={posts.length >= currentLimit}
          />
        </div>
      </main>

      {/* floating back to top button */}
      <button
        className={`back-to-top ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <i className="bi bi-arrow-up-short"></i>
      </button>

      {activeModal === "help" && <HelpModal onClose={closeModals} />}

      {activeModal === "signin" && (
        <SignInModal
          onClose={closeModals}
          onSignIn={async () => {
            await signIn();
            closeModals();
          }}
        />
      )}

      <footer>
        <p>
          &copy; 2025 The Open Dissent (
          <a
            href="https://forms.gle/EA1DcFzigrmjRqZK8"
            target="_blank"
            rel="noreferrer"
          >
            Send Feedback
          </a>
          )
        </p>
      </footer>
    </div>
  );
}
