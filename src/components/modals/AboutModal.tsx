import { ListenChip } from "../ListenChip";

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
        The Open Dissent is a platform for{" "}
        <strong>anonymous political debate</strong>.
        <br />
        <br />
        We believe ideas should stand on their own merit. That means no public
        profiles and <strong>no engagement algorithms</strong>. Our feed is
        shuffled to ensure you see a diverse range of opinions, not just the
        loudest ones.
        <br />
        <br />
        Post your thoughts today for a chance to be featured on our debate-style
        show!
      </p>

      {/* podcast links */}
      <div className="shrink-0 flex items-center justify-center">
        <ListenChip />
      </div>
    </div>
  );
};
