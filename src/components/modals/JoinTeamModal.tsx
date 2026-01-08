import { useModal } from "../../context/ModalContext";

const joinTheTeamFormLink = "https://forms.gle/vmRCZ9qrTej2mcFH9";

export const JoinTeamModal = () => {
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col items-center p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-logo-blue/10 text-logo-blue">
        <i className="bi bi-rocket-takeoff-fill text-xl"></i>
      </div>
      <h2 className="mb-2 text-xl font-bold text-slate-800">Join the Team</h2>
      <p className="text-sm text-slate-500 mb-5">
        We have open positions in <strong>Research</strong>,{" "}
        <strong>Marketing</strong>, and <strong>Media/Graphic Design</strong>.
        If any of these areas interest you (or you just want to get involved)
        submit the form below.
      </p>

      <a
        href={joinTheTeamFormLink}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all  hover:shadow-md active:scale-95"
        onClick={closeModal}
      >
        <div className="flex flex-col items-start text-left">
          <span className="text-base font-bold text-slate-800">
            Join the Team
          </span>
        </div>
        <i className="bi bi-box-arrow-up-right ml-auto text-slate-300"></i>
      </a>
    </div>
  );
};
