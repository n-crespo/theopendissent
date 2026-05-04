import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { SEO } from "../components/ui/Seo";

export const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openModal } = useModal();

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 px-4">
      <SEO title="Settings" description="Manage your account settings" />

      <header className="grid grid-cols-3 items-center w-full mt-2 mb-4">
        <button
          className="justify-self-start p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-95"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left text-2xl"></i>
        </button>
        <h1 className="justify-self-center text-lg font-bold text-slate-900 tracking-tight">
          Settings
        </h1>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        {/* General Settings Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-slate-900 px-1 tracking-tight">
            Account Info
          </h2>
          <div className="flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-[clamp(1rem,3vw,1.25rem)] gap-y-4">
            <div className="flex flex-col">
              <span className="flex items-center flex-wrap gap-1 text-[0.7rem] text-slate-400 font-medium tracking-tight">
                Email
              </span>
              <span className="text-[1.0625rem] text-slate-800 leading-relaxed font-medium">
                {user.email}
              </span>
            </div>
            {user.displayName && (
              <div className="flex flex-col pt-4 border-t border-slate-100">
                <span className="flex items-center flex-wrap gap-1 text-[0.7rem] text-slate-400 font-medium tracking-tight">
                  Display Name
                </span>
                <span className="text-[1.0625rem] text-slate-800 leading-relaxed font-medium">
                  {user.displayName}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="flex flex-col gap-3 mt-4">
          <h2 className="text-lg font-bold text-logo-red px-1 tracking-tight flex items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill text-[18px]"></i>
            Danger Zone
          </h2>
          <div className="flex flex-col bg-white border border-logo-red/30 shadow-sm rounded-2xl overflow-hidden p-[clamp(1rem,3vw,1.25rem)] gap-y-4">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-slate-900 leading-snug">
                Delete Account
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Deleting your account is irreversible. Please be certain before
                proceeding.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 mt-2">
              <button
                onClick={() => openModal("deleteAccount")}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white cursor-pointer transition-all active:scale-95 bg-logo-red hover:brightness-110 gap-x-2 mt-2"
              >
                <i className="bi bi-trash3-fill"></i>
                Delete my account
              </button>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};
