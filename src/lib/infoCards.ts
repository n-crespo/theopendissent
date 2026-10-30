import { LINKS } from "./links";

export interface InfoCardAction {
  label: string;
  href: string;
  img?: string;
}

export interface InfoCardData {
  id: string;
  body: string;
  actions: InfoCardAction[];
  requiresAuth?: boolean;
}

export type FeedEntry<T> =
  | { kind: "post"; post: T }
  | { kind: "info"; card: InfoCardData; slot: number };

export const INFO_CARDS: InfoCardData[] = [
  {
    id: "listen",
    body: "Listen to The Open Dissent wherever you get your podcasts!",
    actions: [
      { label: "Spotify", href: LINKS.spotify, img: "/spotify_logo.png" },
      {
        label: "Apple Podcasts",
        href: LINKS.applePodcasts,
        img: "/apple_podcasts_logo.png",
      },
    ],
  },
  {
    id: "follow",
    body: "We post updates on our socials. Come say hi!",
    actions: [
      { label: "Instagram", href: LINKS.instagram, img: "/instagram_logo.png" },
      { label: "LinkedIn", href: LINKS.linkedin, img: "/linkedin_logo.png" },
    ],
  },
  {
    id: "feedback",
    body: "We're still building this. What should we fix next?",
    actions: [{ label: "Send feedback", href: LINKS.feedbackForm }],
    requiresAuth: true,
  },
  {
    id: "joinTeam",
    body: "We have open positions in research, software and marketing/design. Join the team!",
    actions: [{ label: "Apply now", href: LINKS.joinTeamForm }],
  },
];

const shuffle = <T>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Frozen at module load time, so a card never swaps while the user is reading
 * but the first card varies between visits.
 */
const sessionOrder = shuffle(INFO_CARDS);

export const getVisibleInfoCards = (isLoggedIn: boolean): InfoCardData[] =>
  sessionOrder.filter((card) => isLoggedIn || !card.requiresAuth);

/**
 * Places a card after every `every` posts until the cards run out. Each card
 * is used at most once, and a card is never the last item in the feed.
 *
 * Position stands in for "the user has scrolled a bit": the first card is
 * below the fold on any screen, so no scroll listeners are needed.
 */
export const interleaveInfoCards = <T>(
  posts: T[],
  cards: InfoCardData[],
  every = 6,
): FeedEntry<T>[] => {
  const entries: FeedEntry<T>[] = [];
  let slot = 0;

  posts.forEach((post, i) => {
    entries.push({ kind: "post", post });

    const position = i + 1;
    const isCardPosition = position === every * (slot + 1);

    if (isCardPosition && slot < cards.length && position < posts.length) {
      entries.push({ kind: "info", card: cards[slot], slot });
      slot++;
    }
  });

  return entries;
};
