import { usePwa } from "../../context/PwaContext";

/**
 * matches the refined global modal styling.
 * uses css variables for consistent geometry and professional spacing.
 */
export const HelpModal = () => {
  const { deferredPrompt, install } = usePwa();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const spotifyLogo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png";
  const appleLogo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Podcasts_%28iOS%29.svg/2048px-Podcasts_%28iOS%29.svg.png";

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
      <div className="flex justify-center gap-8 mb-8">
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

      <h4 className="text-base font-semibold mb-4 border-b border-border-subtle pb-1.5 text-slate-900">
        How to Interact
      </h4>
      <ul className="space-y-4 mb-8 px-1">
        <li className="flex items-center gap-4">
          <i className="bi bi-check-square text-agree text-xl"></i>
          <span className="text-sm font-medium italic">Agreed!</span>
        </li>
        <li className="flex items-center gap-4">
          <i className="bi bi-chat-left-text text-dissent text-xl"></i>
          <span className="text-sm font-medium italic">Dissent!</span>
        </li>
      </ul>

      <div className="pt-6 border-t border-border-subtle">
        <h4 className="text-base font-semibold mb-4 text-slate-900">
          Install as an App
        </h4>
        {isIOS ? (
          <ul className="space-y-3 list-disc pl-5 text-sm text-slate-600">
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
                className="text-logo-blue font-medium hover:underline"
              >
                Detailed guide (iOS).
              </a>
            </li>
          </ul>
        ) : deferredPrompt ? (
          <button
            className="w-full my-2 flex items-center justify-center gap-2.5 rounded-(--radius-button) border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98]"
            onClick={install}
          >
            <i className="bi bi-download text-base text-slate-500"></i>
            Install App
          </button>
        ) : (
          /* status box: uses global preview token */
          <p className="p-3 bg-bg-preview rounded-(--radius-input) text-center border border-dashed border-border-subtle text-xs text-slate-500 italic">
            Already installed or unavailable on this browser.
          </p>
        )}
      </div>
    </div>
  );
};
