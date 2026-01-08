import { useModal } from "../context/ModalContext";
import { Chip } from "./ui/Chip";

export const JoinTeamChip = () => {
  const { openModal } = useModal();

  return (
    <Chip
      isActive={false}
      onClick={() => openModal("joinTeam")}
      icon={<i className="bi bi-rocket-takeoff"></i>}
    >
      Join the Team
    </Chip>
  );
};
