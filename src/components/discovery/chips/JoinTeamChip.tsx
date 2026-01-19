import { Chip } from "../../ui/Chip";
import { useModal } from "../../../context/ModalContext";

export const JoinTeamChip = () => {
  const { openModal } = useModal();

  return (
    <Chip
      isActive={false}
      onClick={() => openModal("joinTeam")}
      icon={<i className="bi bi-rocket-takeoff text-logo-blue"></i>}
    >
      Join the Team!
    </Chip>
  );
};
