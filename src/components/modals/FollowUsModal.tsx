import { useModal } from "../../context/ModalContext";

export const FollowUsModal = () => {
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col items-center justify-center p-8 pt-4 text-center">
      {/* Icon Header */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 text-logo-red shadow-inner border border-slate-100">
        <i className="bi bi-chat-square-heart text-4xl"></i>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-slate-800">
        Follow The Open Dissent
      </h2>

      <p className="mb-8 max-w-xs text-center text-sm text-slate-500 leading-relaxed">
        Follow our socials to stay updated on new episodes and other
        developments!
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {/* Instagram */}
        <a
          href="https://www.instagram.com/theopendissent/"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[#ED317E]/50 hover:shadow-md active:scale-95"
          onClick={closeModal}
        >
          <img
            src="/instagram_logo.png"
            alt="Spotify"
            className="h-10 w-10 shrink-0 rounded-md object-contain"
          />
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Follow us on
            </span>
            <span className="text-base font-bold text-slate-800 group-hover:text-[#ED317E] transition-colors">
              Instagram
            </span>
          </div>
          <i className="bi bi-box-arrow-up-right ml-auto text-slate-300 group-hover:text-[#ED317E]"></i>
        </a>

        {/* Linkedin */}
        <a
          href="https://www.linkedin.com/company/the-open-dissent"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[#0A66C2]/50 hover:shadow-md active:scale-95"
          onClick={closeModal}
        >
          <img
            src="/linkedin_logo.png"
            alt="Spotify"
            className="h-10 w-10 shrink-0 rounded-md object-contain"
          />
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Check out our
            </span>
            <span className="text-base font-bold text-slate-800 group-hover:text-[#0A66C2] transition-colors">
              LinkedIn
            </span>
          </div>
          <i className="bi bi-box-arrow-up-right ml-auto text-slate-300 group-hover:text-[#0A66C2]"></i>
        </a>
      </div>
    </div>
  );
};
