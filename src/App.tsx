import { useEffect, useState } from "react";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { GlobalModal } from "./components/modals/GlobalModal";
import { useDeepLinkHandler } from "./hooks/useDeepLinkHandler";

import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { PostDetails } from "./pages/PostDetails";

function Layout() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { pathname } = useLocation();

  useDeepLinkHandler();

  // reset scroll position when the route changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-logo-offwhite">
      <Header />

      {/* Standardized Content Container */}
      <main className="mx-auto w-full max-w-125 px-4 pb-4">
        <Outlet />
      </main>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed z-99 flex items-center justify-center rounded-full border-none text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 cubic-bezier-[0.4,0,0.2,1] cursor-pointer
          bg-[#222222] hover:bg-gray-custom hover:scale-110
          right-7.5 bottom-7.5 h-11.25 w-11.25 text-[24px]
          max-[600px]:right-5 max-[600px]:bottom-5 max-[600px]:h-10 max-[600px]:w-10
          ${showScrollTop ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-5"}
        `}
      >
        <i className="bi bi-arrow-up-short leading-none"></i>
      </button>

      <GlobalModal />
      <Footer />
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
