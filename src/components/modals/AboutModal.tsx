import { useState } from "react";
import { PostInput } from "../feed/PostInput";
import { InteractionSlider } from "../ui/InteractionSlider";
import { useModal } from "../../context/ModalContext";

/**
 * General information about the platform and links to external media.
 * Renamed from HelpModal.
 */
export const AboutModal = () => {
  const [sliderValue, setSliderValue] = useState<number | undefined>(undefined);
  const { openModal } = useModal();

  return (
    <div className="flex flex-col text-slate-700 px-4">
      {/* title */}
      <h2 className="text-2xl mb-0 text-slate-900 text-center tracking-tight font-bold">
        Welcome to The Open Dissent!
      </h2>

      <div className="mx-2 mb-4">
        {/* sub header */}
        <h3 className="text-center font-medium text-slate-500 text-sm tracking-wide mt-2">
          Here's how this all works:
        </h3>

        {/* contents */}
        <ul className="space-y-8 text-sm mt-6">
          <li className="flex flex-col gap-2">
            <div className="flex gap-3">
              <span className="text-logo-blue font-black text-lg leading-none">
                1.
              </span>
              <span className="leading-snug">
                <strong>Browse and Rate:</strong> Rate your stance on any post
                from -3 (Strongly Disagree) to +3 (Strongly Agree)!
              </span>
            </div>
          </li>
          <InteractionSlider
            value={sliderValue}
            onChange={setSliderValue}
            disabled={false}
            dim={false}
            blur={false}
          />

          <li className="flex flex-col gap-2">
            <div className="flex gap-3">
              <span className="text-logo-blue font-black text-lg leading-none">
                2.
              </span>
              <span className="leading-snug">
                <strong>Unlock Replies:</strong> Rating a post unlocks the
                ability to reply with your own thoughts!
              </span>
            </div>
          </li>
          <PostInput
            parentPostId="top"
            currentScore={sliderValue}
            onSubmitOverride={(content) => {
              // console.log("mock post submitted from tutorial:", content);
            }}
          />

          <li className="flex gap-3 items-start pt-2">
            <span className="font-black text-lg leading-none mt-1">3.</span>
            <div className="flex flex-col gap-3">
              <span className="leading-snug">
                <strong>Get Featured:</strong> Posters are randomly selected for
                the chance to be featured on our companion podcast!
              </span>
            </div>
          </li>
          <div className="flex justify-center">
            <button
              onClick={() => openModal("listen")}
              className="text-white self-start flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors active:scale-95 shadow-2xl bg-linear-to-r from-logo-blue via-logo-green to-logo-red text-md animate-bounceJiggle"
            >
              <i className="bi bi-headphones text-sm"></i> Listen Now!
            </button>
          </div>
        </ul>
      </div>
    </div>
  );
};
