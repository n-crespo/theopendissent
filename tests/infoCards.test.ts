import { describe, expect, it } from "vitest";
import {
  FeedEntry,
  getVisibleInfoCards,
  INFO_CARDS,
  interleaveInfoCards,
} from "../src/lib/infoCards.ts";

const makePosts = (count: number) =>
  Array.from({ length: count }, (_, i) => i + 1);

const cards = INFO_CARDS.slice(0, 2);

// number of posts rendered above each info card
const cardPositions = (entries: FeedEntry<number>[]) => {
  const positions: number[] = [];
  let postCount = 0;
  entries.forEach((entry) => {
    if (entry.kind === "post") postCount++;
    else positions.push(postCount);
  });
  return positions;
};

const positionsFor = (postCount: number, availableCards = cards) =>
  cardPositions(interleaveInfoCards(makePosts(postCount), availableCards));

describe("interleaveInfoCards", () => {
  it("places a card every 6 posts", () => {
    expect(positionsFor(15, INFO_CARDS)).toEqual([6, 12]);
    expect(positionsFor(25, INFO_CARDS)).toEqual([6, 12, 18]);
  });

  it("stops once every card has been used", () => {
    expect(positionsFor(100, cards)).toEqual([6, 12]);
    expect(positionsFor(100, cards.slice(0, 1))).toEqual([6]);
  });

  it("never repeats a card", () => {
    const ids = interleaveInfoCards(makePosts(100), INFO_CARDS).flatMap(
      (entry) => (entry.kind === "info" ? [entry.card.id] : []),
    );
    expect(ids).toHaveLength(INFO_CARDS.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never ends the feed on a card", () => {
    expect(positionsFor(6)).toEqual([]);
    expect(positionsFor(7)).toEqual([6]);
  });

  it("keeps every post in order", () => {
    const posts = makePosts(30);
    const kept = interleaveInfoCards(posts, cards).flatMap((entry) =>
      entry.kind === "post" ? [entry.post] : [],
    );
    expect(kept).toEqual(posts);
  });

  it("returns only posts when there are no cards", () => {
    expect(positionsFor(20, [])).toEqual([]);
  });
});

describe("getVisibleInfoCards", () => {
  const ids = (isLoggedIn: boolean) =>
    getVisibleInfoCards(isLoggedIn).map((card) => card.id);

  it("hides the feedback card from logged-out users", () => {
    expect(ids(false)).toEqual(["follow"]);
  });

  it("shows the feedback card to logged-in users", () => {
    expect(ids(true)).toContain("feedback");
  });

  it("hides disabled cards", () => {
    expect(ids(true)).not.toContain("listen");
  });

  it("keeps the same order across calls", () => {
    expect(ids(true)).toEqual(ids(true));
  });
});
