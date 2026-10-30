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
  it("shows one card in the first chunk of posts", () => {
    expect(positionsFor(15)).toEqual([8]);
  });

  it("shows the second card after one load more", () => {
    expect(positionsFor(25)).toEqual([8, 16]);
  });

  it("never shows more than max cards", () => {
    expect(positionsFor(100, INFO_CARDS)).toEqual([8, 16]);
  });

  it("never repeats a card when fewer cards than slots exist", () => {
    expect(positionsFor(100, cards.slice(0, 1))).toEqual([8]);
  });

  it("never ends the feed on a card", () => {
    expect(positionsFor(8)).toEqual([]);
    expect(positionsFor(9)).toEqual([8]);
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
