import { useModal } from "../../context/ModalContext";
import { HowItWorks } from "../home/HowItWorks";
import { GradientButton } from "../ui/GradientButton";

export const InfoModal = () => {
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col gap-y-6">
      <h2 className="text-xl font-bold tracking-tight text-stone-900">
        Welcome to The Open Dissent!
      </h2>

      {/* the modal shell is already the card, so the letter sits directly in it */}
      <HowItWorks />

      <div className="w-full flex flex-col gap-2">
        <GradientButton onClick={closeModal}>
          Join the Conversation
        </GradientButton>
      </div>
    </div>
  );
};
