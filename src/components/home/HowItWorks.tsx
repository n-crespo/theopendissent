import { useModal } from "../../context/ModalContext";

/** The "how this works" note, shown in the welcome modal and on About. */
export const HowItWorks = () => {
  const { openModal } = useModal();

  const handleListenClick = () => {
    setTimeout(() => {
      openModal("listen");
    }, 150);
  };

  return (
    <>
      <p className="mb-4">
        The Open Dissent was made <em>by</em> students, <em>for</em> students,
        with the goal of promoting open political discourse at UCLA.
      </p>
      <p className="mb-4">
        Join any discussion (or start your own!) anonymously (or not) — all are
        welcome!
      </p>
      <p className="mb-4">
        And keep an eye out for{" "}
        <button
          onClick={handleListenClick}
          className="font-bold text-logo-blue hover:underline underline cursor-pointer"
        >
          our podcast
        </button>{" "}
        where we invite dissenters (like you!) to a live, in-person discussion!
      </p>
      <div className="mt-2 text-center">
        Looking forward to disagreeing (or agreeing) with you,
        <br />
        <span className="font-bold bg-linear-to-r from-logo-red via-logo-green to-logo-blue bg-clip-text text-transparent animate-shimmer text-base tracking-tight mt-1 inline-block">
          The Open Dissent Leadership
        </span>
      </div>
    </>
  );
};
