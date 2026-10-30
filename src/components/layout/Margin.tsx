import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LINKS } from "../../lib/links";
import { PROMISES } from "../../lib/promises";
import { TextLink } from "../ui/TextLink";
import { LegalLinks } from "./LegalLinks";

const noteClass = "text-sm leading-relaxed text-stone-600";
const runInClass = "font-semibold text-stone-900";

/**
 * Right column, read like the margin of a publication: running text that steps
 * down in size, no boxes. It only ever carries organization content, never
 * anything ranked by engagement.
 */
export const Margin = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // About already says all of this in the center column
  const isHidden = pathname === "/about";

  return (
    <aside
      aria-label="About The Open Dissent"
      className="sticky top-0 hidden h-screen flex-col gap-4 overflow-y-auto py-5 [scrollbar-width:none] wide:flex"
    >
      {!isHidden && (
        <>
          <p className="text-lg leading-snug font-medium tracking-tight text-stone-900">
            Made <em>by</em> students, <em>for</em> students, to promote open
            political discourse at UCLA.
          </p>

          {!user && (
            <p className={noteClass}>
              {PROMISES.map((promise) => promise.title).join(" ")}{" "}
              <Link
                to="/about"
                className="whitespace-nowrap text-stone-800 underline decoration-stone-300 underline-offset-3 transition-colors hover:decoration-stone-700"
              >
                How it works
              </Link>
            </p>
          )}

          <hr className="border-stone-200" />

          <p className={noteClass}>
            <span className={runInClass}>The podcast.</span> We invite
            dissenters (like you!) to a live, in-person discussion. Listen on{" "}
            <TextLink href={LINKS.spotify} logo="/spotify_logo.png">
              Spotify
            </TextLink>{" "}
            or{" "}
            <TextLink
              href={LINKS.applePodcasts}
              logo="/apple_podcasts_logo.png"
            >
              Apple Podcasts
            </TextLink>
            .
          </p>

          <p className={noteClass}>
            <span className={runInClass}>Join us.</span> We have open positions
            in research, software and marketing/design.{" "}
            <TextLink href={LINKS.joinTeamForm}>Apply now</TextLink>, or tell us{" "}
            <TextLink href={LINKS.feedbackForm}>what to fix next</TextLink>.
          </p>

          <div className="mt-auto flex flex-col gap-1 pt-4">
            <p className="text-xs leading-relaxed text-stone-500">
              Follow us on{" "}
              <TextLink href={LINKS.instagram} logo="/instagram_logo.png">
                Instagram
              </TextLink>{" "}
              and{" "}
              <TextLink href={LINKS.linkedin} logo="/linkedin_logo.png">
                LinkedIn
              </TextLink>
              .
            </p>
            <LegalLinks />
          </div>
        </>
      )}
    </aside>
  );
};
