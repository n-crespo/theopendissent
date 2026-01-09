import { useEffect, useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { GlobalModal } from "./components/modals/GlobalModal";
import { useDeepLinkHandler } from "./hooks/useDeepLinkHandler";

// Import Pages
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";

function Layout() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  useDeepLinkHandler();

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-logo-offwhite">
      <Header />

      <main>
        {/* The Outlet renders the current route (Home or Profile) */}
        <Outlet />
      </main>

      {/* Scroll to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed z-99 flex items-center justify-center rounded-full border-none text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 cubic-bezier-[0.4,0,0.2,1] cursor-pointer
          bg-[#222222] hover:bg-gray-custom hover:scale-110
          right-7.5 bottom-7.5 h-11.25 w-11.25 text-[24px]
          max-[600px]:right-5 max-[600px]:bottom-5 max-[600px]:h-10 max-[600px]:w-10
          ${
            showScrollTop
              ? "opacity-100 visible translate-y-0"
              : "opacity-0 invisible translate-y-5"
          }
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
      </Route>
    </Routes>
  );
}
