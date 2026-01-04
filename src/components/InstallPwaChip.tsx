import { usePwa } from "../context/PwaContext";
import { useModal } from "../context/ModalContext";
import { Chip } from "./ui/Chip";

/**
 * Renders a chip to install the PWA.
 * Triggers native install if available, or opens instructions modal for iOS.
 */
export const InstallPwaChip = () => {
  const { deferredPrompt, install } = usePwa();
  const { openModal } = useModal();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // If already installed or not compatible (and not iOS), hide the chip
  if (!deferredPrompt && !isIOS) return null;

  const handleInstallClick = () => {
    if (deferredPrompt) {
      install();
    } else if (isIOS) {
      openModal("installInstructions");
    }
  };

  return (
    <Chip
      as="button"
      icon={<i className="bi bi-download text-logo-blue"></i>}
      onClick={handleInstallClick}
      className="cursor-pointer"
    >
      Install App
    </Chip>
  );
};
