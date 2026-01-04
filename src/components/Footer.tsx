/**
 * app footer with podcast links and legal info.
 * uses logo- prefix and preserves transition hover states.
 */
export const Footer = () => {
  return (
    <footer className="mt-3 flex flex-col items-center border-t border-slate-200 py-5">
      <div className="flex flex-col items-center gap-1">
        {/* legal row */}
        <div className="flex items-center gap-2 text-[13px] text-gray-custom">
          <p>© 2025 The Open Dissent</p>
          <span className="text-slate-200">•</span>
          <a
            href="https://forms.gle/EA1DcFzigrmjRqZK8"
            target="_blank"
            rel="noreferrer"
            className="text-gray-custom no-underline hover:text-logo-blue hover:underline"
          >
            Feedback
          </a>
        </div>
      </div>
    </footer>
  );
};
