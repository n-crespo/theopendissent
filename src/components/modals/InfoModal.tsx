import { useModal } from "../../context/ModalContext";
import { HowItWorks } from "../home/HowItWorks";

export const InfoModal = () => {
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-stone-900 text-center">
        Welcome to The Open Dissent! <br /> Here's how this works:
      </h2>

      <div className="w-full bg-stone-50 rounded-card p-[clamp(1rem,3vw,1.25rem)] mb-8 flex flex-col border border-stone-200 text-sm text-stone-700 leading-relaxed">
        <HowItWorks />
      </div>

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
