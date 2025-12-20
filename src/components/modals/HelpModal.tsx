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
        console.log("Share cancelled or failed", err);
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

        <h4>Install on Your iPhone or iPad</h4>

        {/* Android/Desktop One-Tap Install */}
        {true && (
          <div className="install-section">
            <button className="btn install-btn" onClick={handleInstallClick}>
              <i className="bi bi-download"></i> Install to Home Screen
            </button>
          </div>
        )}

        {/* iOS Native Share Trigger */}
        {true && (
          <div className="install-section">
            <button
              className="btn install-btn ios-btn"
              onClick={handleShareClick}
            >
              <i className="bi bi-share"></i> Open Share Menu
            </button>
          </div>
        )}

        <ul>
          <li>
            Tap the "Share" button above (or the browser share icon) then "Add
            to Home Screen".
          </li>
          <li>Tap "Add" in the top-right corner.</li>
          <li>
            <a
              href="https://support.apple.com/en-asia/guide/iphone/iphea86e5236/ios"
              target="_blank"
            >
              Click here for a detailed guide (iOS).
            </a>
          </li>
        </ul>
      </div>
    </Modal>
  );
};
