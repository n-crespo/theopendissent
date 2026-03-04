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
import { LandingPage } from "./components/home/LandingPage";

import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { PostDetails } from "./pages/PostDetails";
import { Notifications } from "./pages/Notifications";
import { FeedSortProvider } from "./context/FeedSortContext";

function Layout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const navType = useNavigationType();

  // true while we check localStorage and Auth
  const [isInitialCheck, setIsInitialCheck] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useDeepLinkHandler();

  useEffect(() => {
    // check permanent and session-based dismiss status
    const skipPermanent = localStorage.getItem("skipLanding") === "true";
    const skipSession = sessionStorage.getItem("landingDismissed") === "true";

    // 2. if no user and hasn't skipped (either way), we must show landing
    if (!loading) {
      if (
        !user &&
        !skipPermanent &&
        !skipSession &&
        (pathname === "/" || pathname === "/share")
      ) {
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

    // mark as dismissed for the current session to prevent re-triggering on back-nav
    sessionStorage.setItem("landingDismissed", "true");
    setShowLanding(false);
  };

  // prevent ANY rendering of the header/footer during the auth/storage check
  if (isInitialCheck) return null;

  return (
    <div className="min-h-screen bg-logo-offwhite">
      {/* render landing page at the top level.
          uses fixed inset-0 so it covers the header below.
      */}
      {showLanding && <LandingPage onContinue={handleContinue} />}

      <div
        className={`transition-opacity duration-700 ${
          showLanding ? "opacity-0 invisible" : "opacity-100 visible"
        }`}
      >
        <Header />
        <main className="mx-auto w-full max-w-125 px-4 pb-4 pt-16">
          <Outlet />
        </main>

        <GlobalModal />
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FeedSortProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="share" element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="post/:postId" element={<PostDetails />} />
        </Route>
      </Routes>
    </FeedSortProvider>
  );
}
