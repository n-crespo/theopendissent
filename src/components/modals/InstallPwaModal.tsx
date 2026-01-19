/**
 * Modal showing specific instructions for iOS installation
 * since iOS doesn't support the native install prompt event.
 */
export const InstallPwaModal = () => {
  return (
    <div className="flex flex-col text-slate-700">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        Install on iOS
      </h2>

      <div className="pt-2">
        <ul className="space-y-4 list-none pl-0 text-sm text-slate-600">
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
              1
            </div>
            <span className="pt-0.5">
              Tap the <strong>Share</strong> button{" "}
              <i className="bi bi-box-arrow-up text-logo-blue mx-1"></i> at the
              bottom of your screen.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
              2
            </div>
            <span className="pt-0.5">
              Scroll down and tap <strong>Add to Home Screen</strong>{" "}
              <i className="bi bi-plus-square text-logo-blue mx-1"></i>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
              3
            </div>
            <span className="pt-0.5">
              Tap <strong>Add</strong> in the top right corner.
            </span>
          </li>
        </ul>

        <div className="mt-8 text-center">
          <a
            href="https://support.apple.com/en-asia/guide/iphone/iphea86e5236/ios"
            target="_blank"
            rel="noreferrer"
            className="text-logo-blue font-medium hover:underline text-xs"
          >
            View Apple's official guide
          </a>
        </div>
      </div>
    </div>
  );
};
