import { HowItWorks } from "../components/home/HowItWorks";
import { OrgCards } from "../components/layout/OrgCards";
import { SEO } from "../components/ui/Seo";

export const About = () => {
  return (
    <div className="flex flex-col gap-3">
      <SEO title="About" description="How The Open Dissent works" />

      <h1 className="my-2 text-xl font-bold tracking-tight text-stone-900">
        Here's how this works
      </h1>

      <div className="rounded-card border border-stone-200 bg-white p-[clamp(1rem,3vw,1.25rem)] leading-relaxed text-stone-700 shadow-sm">
        <HowItWorks />
      </div>

      {/* the right column shows these from the wide breakpoint up */}
      <div className="wide:hidden">
        <OrgCards />
      </div>
    </div>
  );
};
