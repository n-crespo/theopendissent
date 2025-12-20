import { Modal } from "./Modal";

interface HelpModalProps {
  onClose: () => void;
  installPrompt: any;
  setInstallPrompt: (val: any) => void;
}

export const HelpModal = ({
  onClose,
  installPrompt,
  setInstallPrompt,
}: HelpModalProps) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleInstallApp = () => {
    if (isIOS) {
      handleShareClick();
    } else if (installPrompt) {
      handleInstallClick();
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "The Open Dissent",
          text: "Join the anonymous discourse at UCLA.",
          url: window.location.href,
        });
      } catch (err) {
        // user cancelled or browser doesn't support
      }
    }
  };

  return (
    <Modal id="help-view" onClose={onClose}>
      <h2>What is this?</h2>
      <div className="modal-content">
        <p>
          The Open Dissent is an open platform for
          <strong> anonymous political discussion</strong>. <br />
          <br />
          Post your thoughts to have a chance to be invited to The Open
          Dissent's debate-style show (coming soon)!
        </p>
        <h4>How to Interact with Posts</h4>
        <ul>
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
        {/* only show section if installation is possible (iOS or prompt available) */}
        {installPrompt || isIOS ? (
          <div className="install-section">
            <h4>Install as an App</h4>

            <button
              className="btn install-btn-outline"
              onClick={handleInstallApp}
            >
              <i className={`bi ${isIOS ? "bi-share" : "bi-download"}`}></i>
              Install
            </button>

            {isIOS && (
              <ul>
                <li>
                  Tap the "Install" button above &gt; "More" &gt; "Add to Home
                  Screen".
                </li>
                <li>Tap "Add" in the top-right corner.</li>
                <li>
                  <a
                    href="https://support.apple.com/en-asia/guide/iphone/iphea86e5236/ios"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Click here for a detailed guide (iOS).
                  </a>
                </li>
              </ul>
            )}
          </div>
        ) : (
          <div className="install-section">
            <h4>Install as an App</h4>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--gray)",
                marginTop: "10px",
              }}
            >
              Already installed or unavailable on this browser.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
