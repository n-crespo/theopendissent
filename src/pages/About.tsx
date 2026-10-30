import { ReactNode } from "react";
import { SEO } from "../components/ui/Seo";
import { TextLink } from "../components/ui/TextLink";
import { LegalLinks } from "../components/layout/LegalLinks";
import { LINKS } from "../lib/links";
import { PROMISES } from "../lib/promises";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-3 border-t border-stone-200 pt-5">
    <h2 className="text-lg font-bold tracking-tight text-stone-900">{title}</h2>
    {children}
  </section>
);

export const About = () => {
  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 text-stone-700">
      <SEO title="About" description="How The Open Dissent works" />

      <header className="flex flex-col gap-3 leading-relaxed">
        <div className="w-max bg-linear-to-r from-logo-red via-logo-green to-logo-blue bg-clip-text text-transparent">
          <p className="text-sm font-bold tracking-wide uppercase">
            Disagree Better
          </p>
        </div>
        <h1 className="-mt-2 text-3xl font-bold tracking-tight text-stone-900">
          By students, for students.
        </h1>
        <p>
          The Open Dissent was made <em>by</em> students, <em>for</em> students,
          with the goal of <b>promoting open political discourse</b> at UCLA.
        </p>
        <p>
          Join any discussion (or start your own!) anonymously (or not) — all
          are welcome!
        </p>
      </header>

      <Section title="How it works">
        <dl className="flex flex-col gap-2.5">
          {PROMISES.map((promise) => (
            <div key={promise.title}>
              <dt className="font-semibold text-stone-900">{promise.title}</dt>
              <dd className="text-sm text-stone-500">{promise.detail}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Listen">
        <p className="leading-relaxed">
          We invite dissenters (like you!) to a live, in-person discussion. Find
          us wherever you get your podcasts, or at the links below!
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <TextLink href={LINKS.spotify} logo="/spotify_logo.png">
            Spotify
          </TextLink>
          <TextLink href={LINKS.applePodcasts} logo="/apple_podcasts_logo.png">
            Apple Podcasts
          </TextLink>
        </p>
      </Section>

      <Section title="Get involved">
        <p className="leading-relaxed">
          We have open positions in <strong>Research</strong>,{" "}
          <strong>Software Development</strong> and{" "}
          <strong>Marketing/Design</strong>.{" "}
          <TextLink href={LINKS.joinTeamForm}>Apply now</TextLink>
        </p>
        <p className="leading-relaxed">
          We're still building this. What should we fix next?{" "}
          <TextLink href={LINKS.feedbackForm}>Send feedback</TextLink>
        </p>
      </Section>

      <Section title="Follow us">
        <p className="leading-relaxed">
          Follow our socials to stay updated on new episodes and other
          developments!
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <TextLink href={LINKS.instagram} logo="/instagram_logo.png">
            Instagram
          </TextLink>
          <TextLink href={LINKS.linkedin} logo="/linkedin_logo.png">
            LinkedIn
          </TextLink>
        </p>
      </Section>

      <div className="border-t border-stone-200 pt-5">
        <LegalLinks />
      </div>
    </div>
  );
};
