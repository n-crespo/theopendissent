const spotifyLogo =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png";
const appleLogo =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Podcasts_%28iOS%29.svg/2048px-Podcasts_%28iOS%29.svg.png";

const logoStyle =
  "h-5 w-5 rounded-md transition-all duration-200 hover:scale-110 opacity-90 hover:opacity-100";

export const ListenPill = () => {
  return (
    <div className="flex justify-center px-4 m-3">
      <div className="group flex items-center gap-3 rounded-full bg-white border border-border-subtle shadow-sm py-1.5 pl-1.5 pr-4 transition-all duration-300">
        {/* Icon Container - styled like the PostItem avatar box but circular */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200/50">
          <i className="bi bi-info-circle-fill text-[14px] leading-none"></i>
        </div>

        {/* Text & Logos */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 tracking-tight">
            Listen on:
          </span>

          <div className="flex items-center gap-2">
            <a
              href="https://open.spotify.com/show/471WfoA8k9zORQPQbLynw2?si=81fb44fe7dd945bf"
              target="_blank"
              rel="noreferrer"
              className="flex items-center"
              aria-label="Listen on Spotify"
            >
              <img src={spotifyLogo} alt="Spotify" className={logoStyle} />
            </a>

            <a
              href="https://podcasts.apple.com/hr/podcast/the-open-dissent/id1860727185"
              target="_blank"
              rel="noreferrer"
              className="flex items-center"
              aria-label="Listen on Apple Podcasts"
            >
              <img src={appleLogo} alt="Apple Podcasts" className={logoStyle} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
