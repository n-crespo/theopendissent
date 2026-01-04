import { Chip } from "./ui/Chip";
import { useModal } from "../context/ModalContext";

export const PodcastSourceChip = () => {
  const { openModal } = useModal();

  return (
    <Chip
      icon={
        <i className="bi bi-broadcast text-[14px] leading-none text-purple-600"></i>
      }
      onClick={() => openModal("listen")}
      className="hover:border-purple-300 transition-colors"
    >
      Listen In!
    </Chip>
  );
};
