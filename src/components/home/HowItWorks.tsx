import { useModal } from "../../context/ModalContext";
import { Badge } from "../ui/Badge";

/**
 * The welcome letter from the team, shown in the welcome modal and on About.
 * Written like a letter rather than a post, so it has no avatar.
 */
export const HowItWorks = () => {
  const { openModal } = useModal();

  const handleListenClick = () => {
    setTimeout(() => {
      openModal("listen");
    }, 150);
  };

  return (
    <div className="flex flex-col gap-y-3 font-serif text-base text-stone-800">
      <p>Dear dissenter,</p>
      <p>
        The Open Dissent was made <em>by</em> students, <em>for</em> students,
        with the goal of promoting open political discourse at UCLA.
      </p>
      <p>
        Join any discussion (or start your own!) anonymously (or not) — all are
        welcome!
      </p>
      <p>
        And keep an eye out for{" "}
        <button
          onClick={handleListenClick}
          className="font-semibold text-logo-blue hover:underline cursor-pointer"
        >
          our podcast
        </button>{" "}
        where we invite dissenters (like you!) to a live, in-person discussion!
      </p>
      <div className="mt-2 flex flex-col gap-y-1">
        <p className="italic text-stone-600">
          Looking forward to disagreeing (or agreeing) with you,
        </p>
        <p className="flex flex-wrap items-center gap-x-1.5">
          <span className="font-bold bg-linear-to-r from-logo-red via-logo-green to-logo-blue bg-clip-text text-transparent animate-shimmer tracking-tight">
            The Open Dissent Leadership
          </span>
          <span className="font-sans">
            <Badge label="Team" variant="slate" />
          </span>
        </p>
      </div>
    </div>
  );
};
