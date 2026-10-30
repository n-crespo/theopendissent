import { useModal } from "../../context/ModalContext";

/**
 * The welcome letter from the team, shown in the welcome modal and on About.
 * Written like a letter rather than a post, so it has no avatar. The page
 * supplies the h1 (the modal an h2) via `headingLevel`.
 */
export const HowItWorks = ({
  headingLevel: Heading = "h2",
}: {
  headingLevel?: "h1" | "h2";
}) => {
  const { openModal } = useModal();

  const handleListenClick = () => {
    setTimeout(() => {
      openModal("listen");
    }, 150);
  };

  return (
    <div className="flex flex-col gap-y-3 text-sm text-stone-700 leading-relaxed">
      <Heading className="text-base font-semibold text-stone-900 leading-tight">
        Welcome to The Open Dissent!
      </Heading>
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
      <p>
        Looking forward to disagreeing (or agreeing) with you,
        <br />
        <span className="font-bold bg-linear-to-r from-logo-red via-logo-green to-logo-blue bg-clip-text text-transparent animate-shimmer tracking-tight mt-1 inline-block">
          The Open Dissent Leadership
        </span>
      </p>
    </div>
  );
};
