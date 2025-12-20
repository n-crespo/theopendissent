const spotifyLogo =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png";
const appleLogo =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Podcasts_%28iOS%29.svg/2048px-Podcasts_%28iOS%29.svg.png"; // standard apple podcast icon url

export const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <div className="podcast-row">
          <span>Listen on</span>
          <div className="podcast-mini-links">
            <a
              href="https://open.spotify.com/show/471WfoA8k9zORQPQbLynw2?si=81fb44fe7dd945bf"
              target="_blank"
              rel="noreferrer"
            >
              <img src={spotifyLogo} alt="Spotify" />
            </a>
            <a
              href="https://podcasts.apple.com/hr/podcast/the-open-dissent/id1860727185"
              target="_blank"
              rel="noreferrer"
            >
              <img src={appleLogo} alt="Apple Podcasts" />
            </a>
          </div>
        </div>

        <div className="footer-legal">
          <p>© 2025 The Open Dissent</p>
          <span className="separator">•</span>
          <a
            href="https://forms.gle/EA1DcFzigrmjRqZK8"
            target="_blank"
            rel="noreferrer"
          >
            Feedback
          </a>
        </div>
      </div>
    </footer>
  );
};
