import { useModal } from "../../context/ModalContext";

export const ListenModal = () => {
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col items-center justify-center p-8 pt-4 text-center">
      {/* Icon Header */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 shadow-inner border border-slate-100">
        <i className="bi bi-broadcast text-4xl"></i>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-slate-800">
        Listen to The Open Dissent
      </h2>

      <p className="mb-8 max-w-xs text-center text-sm text-slate-500 leading-relaxed">
        Find us wherever you get your podcasts, or at the links below!
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {/* Spotify Button */}
        <a
          href="https://open.spotify.com/show/471WfoA8k9zORQPQbLynw2?si=81fb44fe7dd945bf"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[#1DB954]/50 hover:shadow-md active:scale-95"
          onClick={closeModal}
        >
          <img
            src="/spotify_logo.png"
            alt="Spotify"
            className="h-10 w-10 shrink-0 rounded-md object-contain"
          />
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Listen on
            </span>
            <span className="text-base font-bold text-slate-800 group-hover:text-[#1DB954] transition-colors">
              Spotify
            </span>
          </div>
          <i className="bi bi-box-arrow-up-right ml-auto text-slate-300 group-hover:text-[#1DB954]"></i>
        </a>

        {/* Apple Podcasts Button */}
        <a
          href="https://podcasts.apple.com/hr/podcast/the-open-dissent/id1860727185"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[#872EC4]/50 hover:shadow-md active:scale-95"
          onClick={closeModal}
        >
          <img
            src="/apple_podcasts_logo.png"
            alt="Apple Podcasts"
            className="h-10 w-10 shrink-0 rounded-md object-contain"
          />
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Listen on
            </span>
            <span className="text-base font-bold text-slate-800 group-hover:text-[#872EC4] transition-colors">
              Apple Podcasts
            </span>
          </div>
          <i className="bi bi-box-arrow-up-right ml-auto text-slate-300 group-hover:text-[#872EC4]"></i>
        </a>
      </div>
    </div>
  );
};
