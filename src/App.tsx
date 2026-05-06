/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import {
  useLocation,
  useNavigationType,
  Outlet,
  Routes,
  Route,
  useSearchParams,
} from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { GlobalModal } from "./components/modals/GlobalModal";
import { UnauthenticatedFooter } from "./components/layout/UnauthenticatedFooter";
import { useDeepLinkHandler } from "./hooks/useDeepLinkHandler";
import { useAuth } from "./context/AuthContext";
import { useModal } from "./context/ModalContext";
import { LandingPage } from "./components/home/LandingPage";

import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { PostDetails } from "./pages/PostDetails";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { OwnedPostsProvider } from "./context/OwnedPostsContext";
import { FeedSortProvider } from "./context/FeedSortContext";
import { useFeedSort } from "./context/FeedSortContext";
import { usePosts } from "./hooks/usePosts";
import { SidebarContent } from "./components/layout/SidebarContent";
import { Post } from "./types/index";
import { CreatePostFAB } from "./components/feed/CreatePostFAB";
import { ComposeModal } from "./components/feed/ComposeModal";

function Layout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navType = useNavigationType();

  // usePosts lives here so it NEVER unmounts during navigation.
  // Feed state is passed to child routes through outlet context.
  const { sortType } = useFeedSort();
  const feedState = usePosts(sortType);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [activeParent, setActiveParent] = useState<Post | null>(null);
  const [activeReplyTo, setActiveReplyTo] = useState<Post | null>(null);

  const [activeTarget, setActiveTarget] = useState<{
    id: string;
    parentId?: string;
  } | null>(null);

  const [isInitialCheck, setIsInitialCheck] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  const { openModal } = useModal();

  const handleOpenCompose = useCallback(
    (val: boolean) => {
      if (val && !user) {
        openModal("signin");
        return;
      }
      setIsComposeOpen(val);
    },
    [user, openModal],
  );

  useDeepLinkHandler();

  useEffect(() => {
    if (user && !loading) {
      const justLoggedIn = sessionStorage.getItem("justLoggedIn") === "true";
      if (justLoggedIn) {
        sessionStorage.removeItem("justLoggedIn");
        setTimeout(() => {
          openModal("info");
        }, 500);
      }
    }
  }, [user, loading, openModal]);

  useEffect(() => {
    const skipPermanent = localStorage.getItem("skipLanding") === "true";
    const skipSession = sessionStorage.getItem("landingDismissed") === "true";
    const isDev = import.meta.env.DEV;

    if (!loading) {
      // check if this is a share link
      const isShareLink = searchParams.has("s");
      const isCorrectPath = pathname === "/" || pathname === "/share";

      // only show landing if we aren't following a specific share link
      const shouldShowInProd =
        !user &&
        !skipPermanent &&
        !skipSession &&
        isCorrectPath &&
        !isShareLink;
      const shouldShowInDev =
        isDev && !skipSession && isCorrectPath && !isShareLink;

      if (shouldShowInDev || shouldShowInProd) {
        setShowLanding(true);
      }
      setIsInitialCheck(false);
    }
  }, [user, loading, pathname, searchParams]);

  useEffect(() => {
    if (navType !== "POP")
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, navType]);

  const handleContinue = (dontShowAgain: boolean) => {
    if (dontShowAgain) localStorage.setItem("skipLanding", "true");
    sessionStorage.setItem("landingDismissed", "true");
    setShowLanding(false);
  };

  if (isInitialCheck) return null;

  return (
    <div className="min-h-screen bg-logo-offwhite">
      {showLanding && <LandingPage onContinue={handleContinue} />}

      <div
        className={`transition-opacity duration-700 ${
          showLanding ? "opacity-0 invisible" : "opacity-100 visible"
        }`}
      >
        <Header />

        <div className="relative mx-auto flex w-full max-w-7xl justify-center gap-4 lg:gap-9 pt-16 px-4">
          {/* SIDEBAR LEFT */}
          <aside className="hidden lg:block w-64 xl:w-80 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar pb-4 lg:pl-10 xl:pl-20">
            <SidebarContent onCompose={() => handleOpenCompose(true)} />
          </aside>

          {/* FEED (CENTER) */}
          <main className="w-full max-w-115 shrink-0 pb-4 lg:px-2 relative">
            <Outlet
              context={{
                setActiveParent,
                setIsComposeOpen: handleOpenCompose,
                setActiveReplyTo,
                activeTarget,
                setActiveTarget,
                feedState,
              }}
            />
          </main>

          {/* SIDEBAR RIGHT */}
          <aside className="hidden lg:block w-64 xl:w-80 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar pb-4">
            {pathname !== "/notifications" && user ? (
              <div className="hidden lg:block px-2">
                <Notifications showHeader={false} />
              </div>
            ) : (
              <div className="lg:hidden w-full" />
            )}
          </aside>

          {user && (
            <div className="fixed inset-0 pointer-events-none z-40 lg:hidden">
              <div className="mx-auto max-w-7xl h-full relative">
                <div className="absolute right-8 md:right-10 bottom-10 md:bottom-12 pointer-events-auto transition-all duration-300 ease-in-out">
                  <CreatePostFAB onClick={() => handleOpenCompose(true)} />
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>

      <GlobalModal />
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => {
          handleOpenCompose(false);
          setActiveReplyTo(null);
        }}
        parentPost={activeParent}
        parentReply={activeReplyTo}
        onSuccess={(newId, parentId) =>
          setActiveTarget({ id: newId, parentId })
        }
      />

      {!user && !loading && !showLanding && <UnauthenticatedFooter />}
    </div>
  );
}

export default function App() {
  return (
    <OwnedPostsProvider>
      <FeedSortProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="share" element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route
              path="notifications"
              element={<Notifications showHeader={true} />}
            />
            <Route path="settings" element={<Settings />} />
            <Route path="post/:postId" element={<PostDetails />} />
          </Route>
        </Routes>
      </FeedSortProvider>
    </OwnedPostsProvider>
  );
}
