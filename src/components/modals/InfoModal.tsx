import { useModal } from "../../context/ModalContext";
import { HowItWorks } from "../home/HowItWorks";

export const InfoModal = () => {
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col gap-y-6">
      {/* the modal shell is already the card, so the letter sits directly in it */}
      <HowItWorks />

      <div className="w-full flex flex-col gap-2">
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-logo-red via-logo-green to-logo-blue animate-shimmer bg-size-[200%_auto] px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition-all hover:brightness-110 group"
          onClick={closeModal}
        >
          Join the Conversation
          <i className="bi bi-arrow-right transition-transform animate-bounceHorizontal"></i>
        </button>
      </div>
    </div>
  );
};
