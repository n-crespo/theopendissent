import { Chip } from "../../ui/Chip";
import { useModal } from "../../../context/ModalContext";

export const FollowUsChip = () => {
  const { openModal } = useModal();

  return (
    <Chip
      icon={<i className="bi bi-chat-square-heart text-logo-red"></i>}
      onClick={() => openModal("followUs")}
    >
      Follow Us!
    </Chip>
  );
};
