import { useState } from "react";
import { Header } from "./components/Header";
import { PostInput } from "./components/PostInput";
import { PostList } from "./components/PostList";
import { SignInModal } from "./components/modals/SignInModal";
import { HelpModal } from "./components/modals/HelpModal";
import { useAuth } from "./hooks/useAuth";
import { usePosts } from "./hooks/usePosts";

export default function App() {
  const { user, signIn, logout } = useAuth();
  const { posts, loading } = usePosts();

  // controls which modal is visible
  const [activeModal, setActiveModal] = useState<"signin" | "help" | null>(
    null,
  );

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

          {loading ? (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              Loading posts...
            </div>
          ) : (
            <PostList
              posts={posts}
              currentUser={user}
              onRequireAuth={() => setActiveModal("signin")}
            />
          )}
        </div>
      </main>

      {/* conditional rendering for modals */}
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
