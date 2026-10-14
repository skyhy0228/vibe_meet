export type Gender = "여성" | "남성" | "논바이너리";
export type Smoking = "비흡연" | "가끔" | "흡연";
export type Drinking = "안함" | "가끔" | "즐김";
export type ContactStyle = "낮음" | "보통" | "높음";
export type DateStyle = "활동형" | "차분형" | "균형형";
export type Religion = "무교" | "기독교" | "천주교" | "불교" | "기타";
export type CategoryKey = "personality" | "interests" | "values" | "dateStyle" | "contact";

export interface Profile {
  id: string;
  ownerId?: string;
  name: string;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  region: string;
  job: string;
  mbti: string;
  religion: Religion;
  interests: string[];
  bio: string;
  extroversion: number;
  activeDate: number;
  contactStyle: ContactStyle;
  smoking: Smoking;
  drinking: Drinking;
  values: string[];
  preferredDates: string[];
  avatarColor: string;
  isUser?: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt: string;
  consentAccepted: boolean;
  profileVisible: boolean;
  profile: Profile;
}

export interface AuthSession {
  accountId: string;
  email: string;
  signedInAt: string;
}

export interface HardFilters {
  gender: Gender | "상관없음";
  minAge: number;
  maxAge: number;
  minHeight: number;
  maxHeight: number;
  minWeight: number;
  maxWeight: number;
  regions: string[];
  smoking: Smoking | "상관없음";
  religion: Religion | "상관없음";
}

export type Weights = Record<CategoryKey, number>;

export interface CategoryScores {
  personality: number;
  interests: number;
  values: number;
  dateStyle: number;
  contact: number;
}

export interface CandidateMatch {
  profile: Profile;
  totalScore: number;
  rank: number;
  scores: CategoryScores;
  commonInterests: string[];
  commonValues: string[];
  strengths: string[];
  differences: string[];
  reason: string;
}

export interface FilterStep {
  key: string;
  label: string;
  before: number;
  after: number;
  removed: number;
}

export interface MatchResult {
  totalProfiles: number;
  eligibleProfiles: number;
  steps: FilterStep[];
  matches: CandidateMatch[];
  topFive: CandidateMatch[];
  emptyReasons: string[];
}

export interface MatchHistory {
  id: string;
  createdAt: string;
  filters: HardFilters;
  weights: Weights;
  topFive: Array<{ id: string; name: string; score: number }>;
}
