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

function Layout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const navType = useNavigationType();

  const [showScrollTop, setShowScrollTop] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 400 : false,
  );

  // true while we check localStorage and Auth
  const [isInitialCheck, setIsInitialCheck] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useDeepLinkHandler();

  useEffect(() => {
    // 1. check localStorage for dismiss status
    const skip = localStorage.getItem("skipLanding") === "true";

    // 2. if no user and hasn't skipped, we must show landing
    if (!loading) {
      if (!user && !skip && (pathname === "/" || pathname === "/share")) {
        setShowLanding(true);
      }
      setIsInitialCheck(false);
    }
  }, [user, loading, pathname]);

  useEffect(() => {
    if (navType !== "POP")
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, navType]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContinue = (dontShowAgain: boolean) => {
    if (dontShowAgain) localStorage.setItem("skipLanding", "true");
    setShowLanding(false);
  };

  // prevent ANY rendering of the header/footer during the auth/storage check
  if (isInitialCheck) return null;

  return (
    <div className="min-h-screen bg-logo-offwhite">
      {/* render landing page at the top level.
          it uses fixed inset-0 so it covers the header below.
      */}
      {showLanding && <LandingPage onContinue={handleContinue} />}

      <div
        className={`transition-opacity duration-700 ${showLanding ? "opacity-0 invisible" : "opacity-100 visible"}`}
      >
        <Header />
        <main className="mx-auto w-full max-w-125 px-4 pb-4 pt-16">
          <Outlet />
        </main>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed z-99 flex items-center justify-center rounded-full border-none text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 bg-[#222222] hover:bg-gray-custom hover:scale-110 right-7.5 bottom-7.5 h-11.25 w-11.25 text-[24px] max-[600px]:right-5 max-[600px]:bottom-5 max-[600px]:h-10 max-[600px]:w-10 ${
            showScrollTop
              ? "opacity-100 visible translate-y-0"
              : "opacity-0 invisible translate-y-5"
          }`}
        >
          <i className="bi bi-arrow-up-short leading-none"></i>
        </button>

        <GlobalModal />
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="share" element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="post/:postId" element={<PostDetails />} />
      </Route>
    </Routes>
  );
}
