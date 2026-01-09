import { useModal } from "../../context/ModalContext";

const joinTheTeamFormLink = "https://forms.gle/vmRCZ9qrTej2mcFH9";

export const JoinTeamModal = () => {
  const { closeModal } = useModal();

  return (
    <div className="flex flex-col items-center justify-center p-8 pt-4 text-center">
      {/* Icon Header */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 shadow-inner border border-slate-100">
        <i className="bi bi-rocket-takeoff text-4xl"></i>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-slate-800">Join the Team</h2>

      <p className="mb-8 max-w-xs text-center text-sm text-slate-500 leading-relaxed">
        We have open positions in <strong>Research</strong>,{" "}
        <strong>Marketing</strong>, <strong>Media</strong>, and{" "}
        <strong>Design</strong>. If you are interested, submit the form below.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {/* Google Forms Button */}
        <a
          href={joinTheTeamFormLink}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-logo-blue/50 hover:shadow-md active:scale-95"
          onClick={closeModal}
        >
          {/* Logo Placeholder (Google Forms Icon style) */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-600">
            <i className="bi bi-file-earmark-text-fill text-xl"></i>
          </div>

          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Apply Now
            </span>
            <span className="text-base font-bold text-slate-800 group-hover:text-logo-blue transition-colors">
              Application Form
            </span>
          </div>
          <i className="bi bi-box-arrow-up-right ml-auto text-slate-300 group-hover:text-logo-blue"></i>
        </a>
      </div>
    </div>
  );
};
