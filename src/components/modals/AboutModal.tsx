/**
 * General information about the platform and links to external media.
 * Renamed from HelpModal.
 */
export const AboutModal = () => {
  const spotifyLogo = "spotify_logo.png";
  const appleLogo = "apple_podcasts_logo.png";

  return (
    <div className="flex flex-col text-slate-700">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        What is this?
      </h2>

      <p className="leading-relaxed mb-8 text-center px-2">
        The Open Dissent is an open platform for{" "}
        <strong className="font-bold text-logo-blue">
          anonymous political discussion
        </strong>
        .
        <br />
        <br />
        Post your thoughts to have a chance to be invited to The Open Dissent's
        debate-style show!
      </p>

      {/* podcast links */}
      <div className="flex justify-center gap-8 mb-2">
        <a
          href="https://open.spotify.com/show/471WfoA8k9zORQPQbLynw2"
          target="_blank"
          rel="noreferrer"
          className="group"
        >
          <img
            src={spotifyLogo}
            alt="Spotify"
            className="h-10 w-10 rounded-(--radius-button) transition-transform duration-200 group-hover:scale-110"
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
            className="h-10 w-10 rounded-(--radius-button) transition-transform duration-200 group-hover:scale-110"
          />
        </a>
      </div>
    </div>
  );
};
