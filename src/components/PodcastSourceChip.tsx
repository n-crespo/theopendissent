import { Chip } from "./ui/Chip";
import { useModal } from "../context/ModalContext";

export const PodcastSourceChip = () => {
  const { openModal } = useModal();

  return (
    <Chip
      icon={
        <i className="bi bi-broadcast-pin text-[14px] leading-none text-logo-blue"></i>
      }
      onClick={() => openModal("listen")}
    >
      Listen In!
    </Chip>
  );
};
