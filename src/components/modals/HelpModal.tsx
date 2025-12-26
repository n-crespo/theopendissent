import { usePwa } from "../../context/PwaContext";

export const HelpModal = () => {
  const { deferredPrompt, install } = usePwa();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const spotifyLogo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png";
  const appleLogo =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Podcasts_%28iOS%29.svg/2048px-Podcasts_%28iOS%29.svg.png";

  return (
    <div className="flex flex-col text-[#333]">
      <h2 className="text-2xl font-bold mb-4 text-[#1a1a1a] text-center">
        What is this?
      </h2>
      <p className="leading-relaxed mb-6 text-center">
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
      <div className="flex justify-center gap-6 mb-8">
        <a
          href="https://open.spotify.com/show/471WfoA8k9zORQPQbLynw2"
          target="_blank"
          rel="noreferrer"
          className="group"
        >
          <img
            src={spotifyLogo}
            alt="Spotify"
            className="h-10 w-10 rounded-lg transition-transform duration-200 group-hover:scale-110"
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
            className="h-10 w-10 rounded-lg transition-transform duration-200 group-hover:scale-110"
          />
        </a>
      </div>

      <h4 className="text-lg font-bold mb-3 border-b border-[#eef0f2] pb-1">
        How to Interact
      </h4>
      <ul className="space-y-3 mb-8">
        <li className="flex items-center gap-3">
          <i className="bi bi-check-square text-agree text-xl"></i>
          <span className="italic">Agreed!</span>
        </li>
        <li className="flex items-center gap-3">
          <i className="bi bi-chat-left-text text-dissent text-xl"></i>
          <span className="italic">Dissent!</span>
        </li>
      </ul>

      <div className="pt-4 border-t border-[#eef0f2]">
        <h4 className="text-lg font-bold mb-3">Install as an App</h4>
        {isIOS ? (
          <ul className="space-y-2 list-disc pl-5 text-sm">
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
                className="text-logo-blue hover:underline"
              >
                Detailed guide (iOS).
              </a>
            </li>
          </ul>
        ) : deferredPrompt ? (
          <button
            className="w-full my-2 p-3 bg-white text-[#222] border border-[#dadce0] rounded-xl flex items-center justify-center gap-2.5 font-semibold cursor-pointer transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:border-slate-400 hover:-translate-y-px"
            onClick={install}
          >
            <i className="bi bi-download text-[1.1rem] text-gray-custom"></i>
            Install
          </button>
        ) : (
          <p className="p-2.5 bg-slate-50 rounded-lg text-center border border-dashed border-[#dadce0] text-sm text-gray-custom italic">
            Already installed or unavailable on this browser.
          </p>
        )}
      </div>
    </div>
  );
};
