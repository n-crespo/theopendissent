import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { PostInput } from "./components/PostInput";
import { PostList } from "./components/PostList";
import { GlobalModal } from "./components/modals/GlobalModal";
import { Footer } from "./components/Footer";

export default function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // handle scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-logo-offwhite">
      <Header />

      <main className="py-5">
        <div className="mx-auto flex max-w-[500px] flex-col gap-5 px-4">
          <PostInput />
          <PostList />
        </div>
      </main>

      {/* back to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed z-[99] flex items-center justify-center rounded-full border-none text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 cubic-bezier-[0.4,0,0.2,1] cursor-pointer
          bg-[#222222] hover:bg-gray-custom hover:scale-110
          right-[30px] bottom-[30px] h-[45px] w-[45px] text-[24px]
          max-[600px]:right-[20px] max-[600px]:bottom-[20px] max-[600px]:h-[40px] max-[600px]:w-[40px]
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
