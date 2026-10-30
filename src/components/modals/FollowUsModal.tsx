import { useModal } from "../../context/ModalContext";
import { LINKS } from "../../lib/links";
import { GradientLink } from "../ui/GradientButton";

export const FollowUsModal = () => {
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col items-center justify-center p-8 pt-4 text-center">
      {/* Icon Header */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-card bg-stone-50 text-logo-red shadow-inner border border-stone-100">
        <i className="bi bi-chat-square-heart text-4xl"></i>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-stone-800">
        Follow The Open Dissent
      </h2>

      <p className="mb-8 max-w-xs text-center text-sm text-stone-500 leading-relaxed">
        Follow our socials to stay updated on new episodes and other
        developments!
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <GradientLink
          href={LINKS.instagram}
          img="/instagram_logo.png"
          onClick={closeModal}
        >
          Follow us on Instagram
        </GradientLink>

        <GradientLink
          href={LINKS.linkedin}
          img="/linkedin_logo.png"
          onClick={closeModal}
        >
          Check out our LinkedIn
        </GradientLink>
      </div>
    </div>
  );
};
