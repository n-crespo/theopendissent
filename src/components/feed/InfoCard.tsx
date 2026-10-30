import { memo } from "react";
import { Badge } from "../ui/Badge";
import { InfoCardData } from "../../lib/infoCards";

/**
 * Short note from the team, placed between posts. Static content only, so it
 * has no subscriptions and never re-renders once mounted.
 */
export const InfoCard = memo(({ card }: { card: InfoCardData }) => (
  <aside
    aria-label="From The Open Dissent"
    className="flex items-start gap-x-3 bg-white border border-stone-200 shadow-sm rounded-card p-[clamp(1rem,3vw,1.25rem)]"
  >
    <img
      src="/favicons/favicon-96x96.png"
      alt=""
      width={40}
      height={40}
      loading="lazy"
      className="h-10 w-10 shrink-0 rounded-control object-cover border border-stone-200/50"
    />
    <div className="flex flex-col gap-y-1 min-w-0">
      <span className="text-sm font-semibold text-stone-900 leading-tight flex items-center gap-x-1.5">
        <span>The Open Dissent</span>
        <Badge label="Team" variant="slate" />
      </span>
      <p className="text-sm text-stone-700 leading-relaxed">{card.body}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {card.actions.map((action) => (
          <a
            key={action.href}
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-x-1.5 py-1 text-sm font-semibold text-logo-blue hover:underline"
          >
            {action.img && (
              <img
                src={action.img}
                alt=""
                width={16}
                height={16}
                loading="lazy"
                className="h-4 w-4 object-contain"
              />
            )}
            <span>{action.label}</span>
            {!action.img && <i className="bi bi-arrow-right"></i>}
          </a>
        ))}
      </div>
    </div>
  </aside>
));
