import { Chip } from "./Chip";

const spotifyLogo =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png";
const appleLogo =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Podcasts_%28iOS%29.svg/2048px-Podcasts_%28iOS%29.svg.png";

const logoStyle =
  "h-5 w-5 rounded-md transition-all duration-200 hover:scale-110 opacity-90 hover:opacity-100";

export const PodcastSourceChip = () => {
  return (
    <Chip icon={<i className="bi bi-broadcast text-[14px] leading-none"></i>}>
      <div className="flex items-center gap-3">
        <span>Listen on:</span>
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href="https://open.spotify.com/show/471WfoA8k9zORQPQbLynw2?si=81fb44fe7dd945bf"
            target="_blank"
            rel="noreferrer"
            aria-label="Spotify"
          >
            <img src={spotifyLogo} alt="Spotify" className={logoStyle} />
          </a>
          <a
            href="https://podcasts.apple.com/hr/podcast/the-open-dissent/id1860727185"
            target="_blank"
            rel="noreferrer"
            aria-label="Apple Podcasts"
          >
            <img src={appleLogo} alt="Apple Podcasts" className={logoStyle} />
          </a>
        </div>
      </div>
    </Chip>
  );
};
