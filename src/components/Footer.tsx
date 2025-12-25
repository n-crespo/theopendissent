const spotifyLogo =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png";
const appleLogo =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Podcasts_%28iOS%29.svg/2048px-Podcasts_%28iOS%29.svg.png";

/**
 * app footer with podcast links and legal info.
 * uses logo- prefix and preserves transition hover states.
 */
export const Footer = () => {
  return (
    <footer className="mt-5 flex flex-col items-center border-t border-slate-200 py-10 pb-5">
      <div className="flex flex-col items-center gap-4">
        {/* podcast row */}
        <div className="flex items-center gap-3 text-sm text-gray-custom">
          <span>Listen on</span>
          <div className="flex gap-3">
            <a
              href="https://open.spotify.com/show/471WfoA8k9zORQPQbLynw2?si=81fb44fe7dd945bf"
              target="_blank"
              rel="noreferrer"
              className="group"
            >
              <img
                src={spotifyLogo}
                alt="Spotify"
                className="h-7 w-7 rounded-md transition-all duration-200 group-hover:-translate-y-0.5"
              />
            </a>
            <a
              href="https://podcasts.apple.com/hr/podcast/the-open-dissent/id1860727185"
              target="_blank"
              rel="noreferrer"
              className="group"
            >
              <img
                src={appleLogo}
                alt="Apple Podcasts"
                className="h-7 w-7 rounded-md transition-all duration-200 group-hover:-translate-y-0.5"
              />
            </a>
          </div>
        </div>

        {/* legal row */}
        <div className="flex items-center gap-2 text-[13px] text-gray-custom">
          <p>© 2025 The Open Dissent</p>
          <span className="text-slate-200">•</span>
          <a
            href="https://forms.gle/EA1DcFzigrmjRqZK8"
            target="_blank"
            rel="noreferrer"
            className="text-gray-custom no-underline hover:text-logo-blue hover:underline"
          >
            Feedback
          </a>
        </div>
      </div>
    </footer>
  );
};
