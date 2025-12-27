import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface PwaContextType {
  deferredPrompt: any;
  install: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export const PwaProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      // always clear the prompt after an attempt
      // the event is now invalid regardless of 'accepted' or 'dismissed'
      setDeferredPrompt(null);

      if (outcome === "accepted") {
        console.log("user accepted the pwa install");
      }
    } catch (err) {
      console.error("pwa installation failed:", err);
      setDeferredPrompt(null);
    }
  };

  return (
    <PwaContext.Provider value={{ deferredPrompt, install }}>
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = () => {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used within PwaProvider");
  return context;
};
