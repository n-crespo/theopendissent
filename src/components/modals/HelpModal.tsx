import { Modal } from "./Modal";
import { useModal } from "../../context/ModalContext";
import { usePwa } from "../../context/PwaContext";

export const HelpModal = () => {
  const { closeModal } = useModal();
  const { deferredPrompt, install } = usePwa();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <Modal id="help-view" onClose={closeModal}>
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
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--gray)",
                marginTop: "10px",
              }}
            >
              Already installed or unavailable on this browser.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
