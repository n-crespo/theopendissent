import { useModal } from "../../context/ModalContext";

export const InfoModal = () => {
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        Welcome to The Open Dissent! <br /> Here's how this works:
      </h2>

      <div className="w-full bg-slate-50 rounded-2xl p-[clamp(1rem,3vw,1.25rem)] mb-8 flex flex-col border border-slate-200 text-sm text-slate-700 leading-relaxed">
        <p className="mb-4">
          The Open Dissent was made <em>by</em> students, <em>for</em> students,
          with the goal of
          <b> promoting political discourse</b> at UCLA.
        </p>
        <p className="mb-4">
          Feel free to join any discussion (or start your own!) anonymously (or
          not) — all are welcome!
        </p>
        <p className="mb-4">
          Also, keep an eye out for our podcast where we invite posters (like
          you!) to an live, in-person discussion!
        </p>
        <p>
          Looking forward to disagreeing (or agreeing) with you,
          <br />
          <span className="font-semibold text-logo-blue">
            TheOpenDissent Leadership
          </span>
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        <button
          className="inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-logo-red via-logo-green to-logo-blue animate-shimmer bg-[length:200%_auto] px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors hover:bg-[#0f4d92]"
          onClick={closeModal}
        >
          Join the Conversation
        </button>
      </div>
    </div>
  );
};
