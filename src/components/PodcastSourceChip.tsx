import { Chip } from "./ui/Chip";
import { useModal } from "../context/ModalContext";

export const PodcastSourceChip = () => {
  const { openModal } = useModal();

  return (
    <Chip
      icon={
        <i className="bi bi-broadcast text-[14px] leading-none text-logo-red"></i>
      }
      onClick={() => openModal("listen")}
    >
      Listen In!
    </Chip>
  );
};
