import { Chip } from "./Chip";

const spotifyLogo = "spotify_logo.png";
const appleLogo = "apple_podcasts_logo.png";

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
