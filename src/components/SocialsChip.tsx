import { Chip } from "./ui/Chip";
import { useModal } from "../context/ModalContext";

export const SocialsChip = () => {
  const { openModal } = useModal();

  return (
    <Chip
      icon={<i className="bi bi-chat-square-heart text-logo-red"></i>}
      className="transition-colors text-logo-green"
      onClick={() => openModal("socials")}
    >
      Follow Us!
    </Chip>
  );
};
