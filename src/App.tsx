/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigationType,
  Outlet,
  Routes,
  Route,
} from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { GlobalModal } from "./components/modals/GlobalModal";
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
import { OwnedPostsProvider } from "./context/OwnedPostsContext";
import { FeedSortProvider } from "./context/FeedSortContext";
import { SidebarContent } from "./components/layout/SidebarContent";
import { Post } from "./types/index";
import { CreatePostFAB } from "./components/feed/CreatePostFAB";
import { ComposeModal } from "./components/feed/ComposeModal";

function Layout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const navType = useNavigationType();

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [activeParent, setActiveParent] = useState<Post | null>(null);
  const [activeReplyTo, setActiveReplyTo] = useState<Post | null>(null);
  const [recentlyRepliedToId, setRecentlyRepliedToId] = useState<string | null>(null);
  const [isInitialCheck, setIsInitialCheck] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  const { openModal } = useModal();

  const handleOpenCompose = (val: boolean) => {
    if (val && !user) {
      openModal("signin");
      return;
    }
    setIsComposeOpen(val);
  };

  useDeepLinkHandler();

  useEffect(() => {
    const skipPermanent = localStorage.getItem("skipLanding") === "true";
    const skipSession = sessionStorage.getItem("landingDismissed") === "true";
    const isDev = import.meta.env.DEV;

    if (!loading) {
      const isCorrectPath = pathname === "/" || pathname === "/share";
      const shouldShowInProd =
        !user && !skipPermanent && !skipSession && isCorrectPath;
      const shouldShowInDev = isDev && !skipSession && isCorrectPath;

      if (shouldShowInDev || shouldShowInProd) {
        setShowLanding(true);
      }
      setIsInitialCheck(false);
    }
  }, [user, loading, pathname]);

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
                recentlyRepliedToId,
                setRecentlyRepliedToId
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

          <div className="fixed inset-0 pointer-events-none z-40 lg:hidden">
            <div className="mx-auto max-w-7xl h-full relative">
              <div className="absolute bottom-10 right-8 md:bottom-12 md:right-10 pointer-events-auto">
                <CreatePostFAB onClick={() => handleOpenCompose(true)} />
              </div>
            </div>
          </div>
        </div>

        <GlobalModal />
        <ComposeModal
          isOpen={isComposeOpen}
          onClose={() => { handleOpenCompose(false); setActiveReplyTo(null); }}
          parentPost={activeParent}
          parentReply={activeReplyTo}
          onReplyPosted={(replyId) => setRecentlyRepliedToId(replyId)}
        />
        <Footer />
      </div>
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
            <Route path="post/:postId" element={<PostDetails />} />
          </Route>
        </Routes>
      </FeedSortProvider>
    </OwnedPostsProvider>
  );
}
