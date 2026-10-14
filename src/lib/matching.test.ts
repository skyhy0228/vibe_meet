import { describe, expect, it } from "vitest";
import { defaultFilters, defaultUser, defaultWeights, profiles } from "../data/profiles";
import { normalizeWeights, runMatching } from "./matching";

describe("matching engine", () => {
  it("normalizes weights to 100", () => {
    const normalized = normalizeWeights({ personality: 10, interests: 10, values: 10, dateStyle: 10, contact: 10 });
    expect(Math.round(Object.values(normalized).reduce((a, b) => a + b, 0))).toBe(100);
  });

  it("excludes the user and applies hard filters", () => {
    const result = runMatching(defaultUser, [defaultUser, ...profiles], defaultFilters, defaultWeights);
    expect(result.matches.some((match) => match.profile.id === defaultUser.id)).toBe(false);
    expect(result.matches.every((match) => match.profile.gender === "남성")).toBe(true);
    expect(result.topFive.length).toBeLessThanOrEqual(5);
  });

  it("returns zero candidates for impossible filters", () => {
    const result = runMatching(defaultUser, profiles, { ...defaultFilters, gender: "남성", minAge: 60, maxAge: 65 }, defaultWeights);
    expect(result.eligibleProfiles).toBe(0);
    expect(result.emptyReasons.length).toBeGreaterThan(0);
  });

  it("exposes element, embedding, and blended similarity scores", () => {
    const result = runMatching(defaultUser, profiles, defaultFilters, defaultWeights);
    const [match] = result.matches;

    expect(match.elementScore).toBeGreaterThanOrEqual(0);
    expect(match.elementScore).toBeLessThanOrEqual(100);
    expect(match.embeddingScore).toBeGreaterThanOrEqual(0);
    expect(match.embeddingScore).toBeLessThanOrEqual(100);
    expect(match.blendedScore).toBe(match.totalScore);
    expect(match.keywordAnalysis.userKeywords).not.toContain(defaultUser.bio);
    expect(match.keywordAnalysis.candidateKeywords).not.toContain(match.profile.bio);
  });
});
