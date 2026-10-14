import type { CandidateMatch, CategoryKey, CategoryScores, FilterStep, HardFilters, MatchResult, Profile, Weights } from "../types";

const contactScore = { 낮음: 1, 보통: 3, 높음: 5 } as const;
const keywordEmbeddings: Record<string, number[]> = {
  여행: [0.9, 0.4, 0.2, 0.7, 0.3, 0.2],
  영화: [0.4, 0.9, 0.2, 0.3, 0.5, 0.6],
  러닝: [0.8, 0.2, 0.8, 0.6, 0.2, 0.1],
  전시: [0.3, 0.8, 0.1, 0.4, 0.8, 0.5],
  와인: [0.2, 0.6, 0.1, 0.3, 0.7, 0.8],
  등산: [0.9, 0.2, 0.9, 0.8, 0.2, 0.1],
  요리: [0.2, 0.5, 0.3, 0.4, 0.6, 0.8],
  독서: [0.1, 0.8, 0.1, 0.2, 0.9, 0.4],
  재즈: [0.2, 0.9, 0.1, 0.2, 0.7, 0.7],
  사진: [0.4, 0.8, 0.2, 0.5, 0.8, 0.5],
  캠핑: [0.9, 0.2, 0.7, 0.8, 0.3, 0.2],
  수영: [0.8, 0.2, 0.9, 0.6, 0.2, 0.1],
  보드게임: [0.3, 0.5, 0.2, 0.7, 0.5, 0.4],
  뮤지컬: [0.2, 0.9, 0.1, 0.4, 0.8, 0.6],
  카페: [0.2, 0.6, 0.1, 0.3, 0.7, 0.7],
  반려식물: [0.1, 0.5, 0.2, 0.2, 0.8, 0.6],
  클라이밍: [0.9, 0.2, 0.9, 0.7, 0.2, 0.1],
  테니스: [0.8, 0.2, 0.8, 0.6, 0.2, 0.1],
  성장: [0.5, 0.3, 0.5, 0.9, 0.6, 0.3],
  배려: [0.2, 0.4, 0.2, 0.8, 0.7, 0.8],
  정직: [0.2, 0.3, 0.2, 0.9, 0.8, 0.5],
  안정: [0.1, 0.3, 0.2, 0.6, 0.8, 0.8],
  자유: [0.8, 0.4, 0.4, 0.7, 0.4, 0.4],
  유머: [0.4, 0.7, 0.3, 0.8, 0.4, 0.7],
  가족: [0.1, 0.3, 0.2, 0.7, 0.7, 0.9],
  성취: [0.5, 0.2, 0.6, 0.9, 0.5, 0.3],
  신뢰: [0.2, 0.3, 0.2, 0.9, 0.8, 0.7],
  대화: [0.3, 0.7, 0.2, 0.8, 0.7, 0.8],
  맛집: [0.3, 0.5, 0.2, 0.5, 0.6, 0.8],
  산책: [0.5, 0.4, 0.4, 0.5, 0.7, 0.6],
  드라이브: [0.8, 0.4, 0.3, 0.6, 0.4, 0.5],
  공연: [0.2, 0.9, 0.1, 0.4, 0.8, 0.6],
  홈쿠킹: [0.1, 0.5, 0.2, 0.4, 0.7, 0.9],
  스포츠: [0.8, 0.2, 0.8, 0.6, 0.2, 0.1],
  야경: [0.5, 0.6, 0.1, 0.4, 0.7, 0.7],
};

export function normalizeWeights(weights: Weights): Weights {
  const sum = Object.values(weights).reduce((total, value) => total + Math.max(0, value), 0) || 1;
  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, (Math.max(0, value) / sum) * 100])
  ) as Weights;
}

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));
const scaleDiff = (a: number, b: number, maxDiff: number) => clampScore(100 - (Math.abs(a - b) / maxDiff) * 100);
const overlapScore = (a: string[], b: string[]) => {
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  const common = a.filter((item) => b.includes(item)).length;
  return clampScore((common / union.size) * 100 + Math.min(common, 3) * 8);
};

const unique = (items: string[]) => Array.from(new Set(items));
const keywordSet = (profile: Profile) => unique([...profile.interests, ...profile.values, ...profile.preferredDates]);
const vectorForKeyword = (keyword: string) => keywordEmbeddings[keyword] || [0.4, 0.4, 0.4, 0.4, 0.4, 0.4];
const averageVector = (keywords: string[]) => {
  const vectors = keywords.map(vectorForKeyword);
  const dimensions = vectors[0]?.length || 6;
  return Array.from({ length: dimensions }, (_, index) => vectors.reduce((sum, vector) => sum + vector[index], 0) / Math.max(vectors.length, 1));
};
const cosineSimilarity = (a: number[], b: number[]) => {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  if (!magnitudeA || !magnitudeB) return 0;
  return dot / (magnitudeA * magnitudeB);
};
const embeddingKeywordScore = (a: string[], b: string[]) => clampScore(cosineSimilarity(averageVector(a), averageVector(b)) * 100);

function mbtiScore(a: string, b: string) {
  const same = [...a].filter((letter, index) => b[index] === letter).length;
  return same * 20 + (a[0] !== b[0] ? 10 : 0) + (a[1] === b[1] ? 10 : 0);
}

export function scoreProfile(user: Profile, candidate: Profile, weights: Weights): Omit<CandidateMatch, "rank"> {
  const commonInterests = user.interests.filter((item) => candidate.interests.includes(item));
  const commonValues = user.values.filter((item) => candidate.values.includes(item));
  const userKeywords = keywordSet(user);
  const candidateKeywords = keywordSet(candidate);
  const sharedKeywords = userKeywords.filter((item) => candidateKeywords.includes(item));
  const elementScore = overlapScore(userKeywords, candidateKeywords);
  const embeddingScore = embeddingKeywordScore(userKeywords, candidateKeywords);
  const scores: CategoryScores = {
    personality: clampScore((mbtiScore(user.mbti, candidate.mbti) + scaleDiff(user.extroversion, candidate.extroversion, 4)) / 2),
    interests: overlapScore(user.interests, candidate.interests),
    values: overlapScore(user.values, candidate.values),
    dateStyle: clampScore((scaleDiff(user.activeDate, candidate.activeDate, 4) + overlapScore(user.preferredDates, candidate.preferredDates)) / 2),
    contact: clampScore((scaleDiff(contactScore[user.contactStyle], contactScore[candidate.contactStyle], 4) + (user.drinking === candidate.drinking ? 100 : 65)) / 2),
  };
  const normalized = normalizeWeights(weights);
  const totalScore = clampScore(
    (Object.keys(scores) as CategoryKey[]).reduce((total, key) => total + scores[key] * (normalized[key] / 100), 0)
  );
  const blendedScore = clampScore(totalScore * 0.6 + elementScore * 0.2 + embeddingScore * 0.2);
  const sortedStrengths = (Object.entries(scores) as Array<[CategoryKey, number]>).sort((a, b) => b[1] - a[1]);
  const strengths = sortedStrengths.slice(0, 2).map(([key]) => categoryLabel[key]);
  const differences = sortedStrengths.slice(-2).reverse().map(([key]) => categoryLabel[key]);
  const reason = buildReason(candidate, blendedScore, scores, commonInterests, commonValues, strengths, differences, elementScore, embeddingScore);
  return {
    profile: candidate,
    totalScore: blendedScore,
    elementScore,
    embeddingScore,
    blendedScore,
    scores,
    keywordAnalysis: { userKeywords, candidateKeywords, sharedKeywords, elementScore, embeddingScore },
    commonInterests,
    commonValues,
    strengths,
    differences,
    reason,
  };
}

export const categoryLabel: Record<CategoryKey, string> = {
  personality: "성격 및 성향",
  interests: "취미 및 관심사",
  values: "연애 가치관",
  dateStyle: "데이트 스타일",
  contact: "연락 및 생활 패턴",
};

function buildReason(
  candidate: Profile,
  totalScore: number,
  scores: CategoryScores,
  commonInterests: string[],
  commonValues: string[],
  strengths: string[],
  differences: string[],
  elementScore: number,
  embeddingScore: number
) {
  const interestText = commonInterests.length ? `${commonInterests.slice(0, 3).join(", ")} 관심사가 겹치고` : "공통 관심사는 적지만";
  const valueText = commonValues.length ? `${commonValues.join(", ")} 가치관이 맞습니다` : "가치관은 추가 대화가 필요합니다";
  const strongest = strengths[0];
  const weakest = differences[0];
  return `${candidate.name}님은 전체 적합도 ${totalScore}점입니다. ${interestText}, ${valueText}. 단순 요소 유사도는 ${elementScore}점, 키워드 임베딩 유사도는 ${embeddingScore}점입니다. 특히 ${strongest} 항목이 ${Math.max(...Object.values(scores))}점으로 높아 추천 순위에 긍정적으로 작용했습니다. ${weakest} 항목은 상대적으로 차이가 있어 실제 만남 전 기대치를 맞춰보는 것이 좋습니다.`;
}

const filters: Array<{
  key: keyof HardFilters;
  label: string;
  pass: (profile: Profile, hardFilters: HardFilters) => boolean;
}> = [
  { key: "gender", label: "성별 조건", pass: (p, f) => f.gender === "상관없음" || p.gender === f.gender },
  { key: "minAge", label: "나이 범위", pass: (p, f) => p.age >= f.minAge && p.age <= f.maxAge },
  { key: "minHeight", label: "키 범위", pass: (p, f) => p.height >= f.minHeight && p.height <= f.maxHeight },
  { key: "minWeight", label: "몸무게 범위", pass: (p, f) => p.weight >= f.minWeight && p.weight <= f.maxWeight },
  { key: "regions", label: "거주 지역", pass: (p, f) => !f.regions.length || f.regions.includes(p.region) },
  { key: "smoking", label: "흡연 여부", pass: (p, f) => f.smoking === "상관없음" || p.smoking === f.smoking },
  { key: "religion", label: "종교 조건", pass: (p, f) => f.religion === "상관없음" || p.religion === f.religion },
];

export function runMatching(user: Profile, allProfiles: Profile[], hardFilters: HardFilters, weights: Weights): MatchResult {
  let candidates = allProfiles.filter((profile) => profile.id !== user.id);
  const steps: FilterStep[] = [];
  const emptyReasons: string[] = [];

  filters.forEach((filter) => {
    const before = candidates.length;
    candidates = candidates.filter((profile) => filter.pass(profile, hardFilters));
    const step = { key: String(filter.key), label: filter.label, before, after: candidates.length, removed: before - candidates.length };
    steps.push(step);
    if (step.removed > 0) emptyReasons.push(`${filter.label}에서 ${step.removed}명이 제외되었습니다.`);
  });

  const matches = candidates
    .map((candidate) => scoreProfile(user, candidate, weights))
    .sort((a, b) => b.totalScore - a.totalScore || b.scores.values - a.scores.values || a.profile.age - b.profile.age || a.profile.id.localeCompare(b.profile.id))
    .map((match, index) => ({ ...match, rank: index + 1 }));

  return {
    totalProfiles: allProfiles.length,
    eligibleProfiles: candidates.length,
    steps,
    matches,
    topFive: matches.slice(0, 5),
    emptyReasons: candidates.length ? [] : emptyReasons,
  };
}
