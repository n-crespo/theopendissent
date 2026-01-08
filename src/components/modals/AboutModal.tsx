import { PodcastSourceChip } from "../PodcastSourceChip";

/**
 * General information about the platform and links to external media.
 * Renamed from HelpModal.
 */
export const AboutModal = () => {
  return (
    <div className="flex flex-col text-slate-700">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        What is this?
      </h2>

      <p className="leading-relaxed mb-8 text-center px-2">
        The Open Dissent is an open platform for{" "}
        <strong className="font-bold text-logo-blue">
          anonymous political discussion
        </strong>
        .
        <br />
        <br />
        Post your thoughts to have a chance to be invited to The Open Dissent's
        debate-style show!
      </p>

      {/* podcast links */}
      <div className="shrink-0 flex items-center justify-center">
        <PodcastSourceChip />
      </div>
    </div>
  );
};
