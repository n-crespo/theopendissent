import { useModal } from "../../context/ModalContext";

export const InfoModal = () => {
  const { closeModal, openModal } = useModal();

  const handleListenClick = () => {
    setTimeout(() => {
      openModal("listen");
    }, 150);
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        Welcome to The Open Dissent! <br /> Here's how this works:
      </h2>

      <div className="w-full bg-slate-50 rounded-2xl p-[clamp(1rem,3vw,1.25rem)] mb-8 flex flex-col border border-slate-200 text-sm text-slate-700 leading-relaxed">
        <p className="mb-4">
          The Open Dissent was made <em>by</em> students, <em>for</em> students,
          with the goal of
          <b> promoting open political discourse</b> at UCLA.
        </p>
        <p className="mb-4">
          Join any discussion (or start your own!) anonymously (or not) — all
          are welcome!
        </p>
        <p className="mb-4">
          And keep an eye out for{" "}
          <button
            onClick={handleListenClick}
            className="font-bold text-logo-blue hover:underline underline cursor-pointer"
          >
            our podcast
          </button>{" "}
          where we invite dissenters (like you!) to a live, in-person
          discussion!
        </p>
        <div className="mt-2 text-center">
          Looking forward to disagreeing (or agreeing) with you,
          <br />
          <span className="font-bold bg-linear-to-r from-logo-red via-logo-green to-logo-blue bg-clip-text text-transparent animate-shimmer text-md tracking-tight mt-1 inline-block">
            The Open Dissent Leadership
          </span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-logo-red via-logo-green to-logo-blue animate-shimmer bg-size-[200%_auto] px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors hover:bg-[#0f4d92] group"
          onClick={closeModal}
        >
          Join the Conversation
          <i className="bi bi-arrow-right transition-transform animate-[bounceHorizontal_1s_infinite]"></i>
        </button>
      </div>
    </div>
  );
};
