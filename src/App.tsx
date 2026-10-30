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
import { GlobalModal } from "./components/modals/GlobalModal";
import { useDeepLinkHandler } from "./hooks/useDeepLinkHandler";
import { useAuth } from "./context/AuthContext";
import { useModal } from "./context/ModalContext";
import { LandingPage } from "./components/home/LandingPage";

import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { About } from "./pages/About";
import { You } from "./pages/You";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { PostDetails } from "./pages/PostDetails";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { OwnedPostsProvider } from "./context/OwnedPostsContext";
import { FeedSortProvider } from "./context/FeedSortContext";
import { useFeedSort } from "./context/FeedSortContext";
import { usePosts } from "./hooks/usePosts";
import { SideRail } from "./components/layout/SideRail";
import { Margin } from "./components/layout/Margin";
import { BottomTabs } from "./components/layout/BottomTabs";
import { Post } from "./types/index";
import { ComposeModal } from "./components/feed/ComposeModal";
import { Toaster } from "./components/ui/Toaster";
import { IS_PREVIEW_AUTH } from "./lib/previewAuth";

function Layout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navType = useNavigationType();
  const isDiscussion = pathname.startsWith("/post/");

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

      {IS_PREVIEW_AUTH && (
        <div className="pointer-events-none fixed bottom-[calc(var(--tabbar-h)+0.5rem)] left-2 z-[100] rail:bottom-2 rounded-full bg-stone-900/80 px-3 py-1 text-xs font-semibold text-white">
          preview mode: fake login, writes disabled
        </div>
      )}

      <div
        className={`transition-opacity duration-700 ${
          showLanding ? "opacity-0 invisible" : "opacity-100 visible"
        }`}
      >
        {/* discussions bring their own top bar and reply bar on phones */}
        {!isDiscussion && <Header />}

        <div className="relative mx-auto w-full max-w-160 px-3 rail:grid rail:max-w-none rail:grid-cols-[84px_minmax(0,600px)] rail:justify-center rail:gap-5 rail:px-4 wide:grid-cols-[84px_minmax(0,600px)_300px] wide:gap-8">
          <SideRail onCompose={() => handleOpenCompose(true)} />

          {/* FEED (CENTER) */}
          <main className="min-w-0 pt-[4.25rem] pb-[calc(var(--tabbar-h)+1.5rem)] rail:pt-4 rail:pb-12 relative">
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

          <Margin />
        </div>

        {!isDiscussion && (
          <BottomTabs onCompose={() => handleOpenCompose(true)} />
        )}
      </div>

      <GlobalModal />
      <Toaster />
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
            <Route path="you" element={<You />} />
            <Route path="profile" element={<Profile />} />
            <Route path="about" element={<About />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="post/:postId" element={<PostDetails />} />
          </Route>
        </Routes>
      </FeedSortProvider>
    </OwnedPostsProvider>
  );
}
