import { useAuth } from "../../context/AuthContext";
import { INFO_CARDS } from "../../lib/infoCards";
import { InfoCard } from "../feed/InfoCard";
import { LegalLinks } from "./LegalLinks";

/**
 * Organization content: the right column on desktop, and the end of the About
 * page below the wide breakpoint where that column doesn't exist.
 */
export const OrgCards = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-3">
      {INFO_CARDS.filter((card) => user || !card.requiresAuth).map((card) => (
        <InfoCard key={card.id} card={card} />
      ))}
      <div className="px-1">
        <LegalLinks />
      </div>
    </div>
  );
};
