import { useModal } from "../../context/ModalContext";
import { LINKS } from "../../lib/links";
import { GradientLink } from "../ui/GradientButton";

export const ListenModal = () => {
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col items-center justify-center p-8 pt-4 text-center">
      {/* Icon Header */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-card bg-stone-50 text-logo-blue shadow-inner border border-stone-100">
        <i className="bi bi-headphones text-4xl"></i>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-stone-800">
        Listen to The Open Dissent
      </h2>

      <p className="mb-8 max-w-xs text-center text-sm text-stone-500 leading-relaxed">
        Find us wherever you get your podcasts, or at the links below!
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <GradientLink
          href={LINKS.spotify}
          img="/spotify_logo.png"
          onClick={closeModal}
        >
          Listen on Spotify
        </GradientLink>

        <GradientLink
          href={LINKS.applePodcasts}
          img="/apple_podcasts_logo.png"
          onClick={closeModal}
        >
          Listen on Apple Podcasts
        </GradientLink>
      </div>
    </div>
  );
};
