import { usePwa } from "../../context/PwaContext";

export const HelpModal = () => {
  const { deferredPrompt, install } = usePwa();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const spotifyLogo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png";
  const appleLogo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Podcasts_%28iOS%29.svg/2048px-Podcasts_%28iOS%29.svg.png";

  return (
    <div className="modal-content" id="help-view">
      <h2>What is this?</h2>
      <p>
        The Open Dissent is an open platform for
        <strong> anonymous political discussion</strong>. <br />
        <br />
        Post your thoughts to have a chance to be invited to The Open Dissent's
        debate-style show (see below)!
      </p>

      <div className="podcast-section">
        <div className="podcast-links">
          <a
            href="https://open.spotify.com/show/471WfoA8k9zORQPQbLynw2?si=81fb44fe7dd945bf"
            target="_blank"
            rel="noreferrer"
            className="podcast-link"
          >
            <img src={spotifyLogo} alt="Spotify" />
          </a>
          <a
            href="https://podcasts.apple.com/hr/podcast/the-open-dissent/id1860727185"
            target="_blank"
            rel="noreferrer"
            className="podcast-link"
          >
            <img src={appleLogo} alt="Apple Podcasts" />
          </a>
        </div>
      </div>

      <h4>How to Interact</h4>
      <ul className="interaction-list">
        <li>
          <i className="bi bi-check-square"></i> <em>Agreed!</em>
        </li>
        <li>
          <i className="bi bi-fire"></i> <em>Interesting take...</em>
        </li>
        <li>
          <i className="bi bi-x-square"></i> <em>I disagree...</em>
        </li>
      </ul>

      <div className="install-section">
        <h4>Install as an App</h4>
        {isIOS ? (
          <ul>
            <li>
              Tap the <strong>Share</strong> button (bottom of screen)
            </li>
            <li>
              Tap <strong>More</strong>, then{" "}
              <strong>Add to Home Screen</strong>
            </li>
            <li>
              <a
                href="https://support.apple.com/en-asia/guide/iphone/iphea86e5236/ios"
                target="_blank"
                rel="noreferrer"
              >
                Detailed guide (iOS).
              </a>
            </li>
          </ul>
        ) : deferredPrompt ? (
          <button className="btn install-btn-outline" onClick={install}>
            <i className="bi bi-download"></i>
            Install
          </button>
        ) : (
          <p className="install-note">
            Already installed or unavailable on this browser.
          </p>
        )}
      </div>
    </div>
  );
};
