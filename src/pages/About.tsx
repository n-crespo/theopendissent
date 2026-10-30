import { HowItWorks } from "../components/home/HowItWorks";
import { OrgCards } from "../components/layout/OrgCards";
import { SEO } from "../components/ui/Seo";

export const About = () => {
  return (
    <div className="flex flex-col gap-3">
      <SEO title="About" description="How The Open Dissent works" />

      <h1 className="my-2 text-xl font-bold tracking-tight text-stone-900">
        Welcome to The Open Dissent!
      </h1>

      {/* same card chrome as the feed's info cards, minus the avatar */}
      <article className="bg-white border border-stone-200 shadow-sm rounded-card p-[clamp(1rem,3vw,1.25rem)]">
        <HowItWorks />
      </article>

      {/* the right column shows these from the wide breakpoint up */}
      <div className="wide:hidden">
        <OrgCards />
      </div>
    </div>
  );
};
