// src/App.tsx
import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { PostInput } from "./components/PostInput";
import { PostList } from "./components/PostList";
import { SignInModal } from "./components/modals/SignInModal";
import { HelpModal } from "./components/modals/HelpModal";
import { LogoutModal } from "./components/modals/LogoutModal";

import { useAuth } from "./context/AuthContext";
import { useModal } from "./context/ModalContext";
import { usePosts } from "./hooks/usePosts";

export default function App() {
  const { user, signIn, logout } = useAuth();
  const { activeModal, openModal, closeModal } = useModal();
  const { posts, loading, loadMore, currentLimit } = usePosts(20);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // handle PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  // handle scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    closeModal();
  };

  return (
    <div className="app-root">
      <Header />

      <main id="body-content">
        <div id="center-container">
          <PostInput />

          <PostList
            posts={posts}
            loadMore={loadMore}
            isLoading={loading}
            hasMore={posts.length >= currentLimit}
          />
        </div>
      </main>

      <button
        className={`back-to-top ${showScrollTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <i className="bi bi-arrow-up-short"></i>
      </button>

      {/* Global Modals */}
      {activeModal === "help" && (
        <HelpModal
          onClose={closeModal}
          installPrompt={deferredPrompt}
          setInstallPrompt={setDeferredPrompt}
        />
      )}

      {activeModal === "signin" && (
        <SignInModal
          onClose={closeModal}
          onSignIn={async () => {
            await signIn();
            closeModal();
          }}
        />
      )}

      {activeModal === "logout" && (
        <LogoutModal
          user={user}
          onClose={closeModal}
          onConfirm={handleLogout}
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
            Feedback
          </a>
          )
        </p>
      </footer>
    </div>
  );
}
