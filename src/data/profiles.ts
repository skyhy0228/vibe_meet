import type { HardFilters, Profile, Weights } from "../types";

export const defaultUser: Profile = {
  id: "user-001",
  name: "나의 프로필",
  age: 29,
  gender: "여성",
  height: 164,
  region: "서울",
  job: "서비스 기획자",
  mbti: "ENFJ",
  religion: "무교",
  interests: ["여행", "영화", "러닝", "전시", "와인"],
  bio: "대화가 잘 통하고 함께 성장할 수 있는 관계를 선호합니다.",
  extroversion: 4,
  activeDate: 4,
  contactStyle: "높음",
  smoking: "비흡연",
  drinking: "가끔",
  values: ["성장", "배려", "정직"],
  preferredDates: ["전시", "맛집", "산책"],
  avatarColor: "#f472b6",
  isUser: true,
};

export const defaultFilters: HardFilters = {
  gender: "남성",
  minAge: 26,
  maxAge: 35,
  minHeight: 170,
  maxHeight: 190,
  regions: ["서울", "경기"],
  smoking: "비흡연",
  religion: "상관없음",
};

export const defaultWeights: Weights = {
  personality: 25,
  interests: 25,
  values: 20,
  dateStyle: 15,
  contact: 15,
};

const names = [
  "서준", "도윤", "하준", "민준", "지호", "현우", "준호", "유찬", "시우", "태오",
  "지훈", "민재", "건우", "승민", "우진", "재윤", "은우", "윤재", "준서", "도현",
  "서연", "지유", "하린", "서아", "지민", "예린", "수아", "다은", "채원", "유나",
  "나은", "민서", "소율", "하윤", "아린", "예지", "서윤", "지원", "유진", "다현",
  "재이", "로운", "이안", "하람"
];
const regions = ["서울", "경기", "인천", "부산", "대전", "대구", "광주", "제주"];
const jobs = ["개발자", "디자이너", "마케터", "교사", "간호사", "회계사", "기획자", "연구원", "셰프", "작가", "변호사", "운동코치"];
const mbtis = ["ENFJ", "ENFP", "ENTJ", "ENTP", "ESFJ", "ESFP", "INFJ", "INFP", "INTJ", "INTP", "ISFJ", "ISFP", "ISTJ", "ISTP"];
const interestPool = ["여행", "영화", "러닝", "전시", "와인", "등산", "요리", "독서", "재즈", "사진", "캠핑", "수영", "보드게임", "뮤지컬", "카페", "반려식물", "클라이밍", "테니스"];
const valuesPool = ["성장", "배려", "정직", "안정", "자유", "유머", "가족", "성취", "신뢰", "대화"];
const datePool = ["전시", "맛집", "산책", "드라이브", "공연", "등산", "홈쿠킹", "카페", "스포츠", "야경"];
const colors = ["#fb7185", "#f97316", "#facc15", "#34d399", "#2dd4bf", "#38bdf8", "#818cf8", "#a78bfa", "#e879f9", "#f472b6"];

const pick = <T,>(items: T[], index: number) => items[index % items.length];
const takePattern = (items: string[], seed: number, count: number) =>
  Array.from({ length: count }, (_, i) => items[(seed * 3 + i * 5) % items.length]).filter((v, i, arr) => arr.indexOf(v) === i);

export const profiles: Profile[] = names.map((name, index) => {
  const male = index < 22;
  return {
    id: `profile-${String(index + 1).padStart(3, "0")}`,
    name,
    age: 24 + ((index * 3) % 17),
    gender: male ? "남성" : index % 9 === 0 ? "논바이너리" : "여성",
    height: male ? 168 + ((index * 4) % 23) : 154 + ((index * 3) % 20),
    region: pick(regions, index),
    job: pick(jobs, index * 2),
    mbti: pick(mbtis, index * 5),
    religion: pick(["무교", "기독교", "천주교", "불교", "기타"], index * 2),
    interests: takePattern(interestPool, index + 1, 5),
    bio: `${pick(jobs, index * 2)}로 일하며 ${pick(interestPool, index + 3)}와 ${pick(datePool, index + 2)}을 좋아합니다.`,
    extroversion: 1 + ((index * 2) % 5),
    activeDate: 1 + ((index * 3) % 5),
    contactStyle: pick(["낮음", "보통", "높음"], index) as Profile["contactStyle"],
    smoking: pick(["비흡연", "가끔", "흡연"], index * 4) as Profile["smoking"],
    drinking: pick(["안함", "가끔", "즐김"], index * 5) as Profile["drinking"],
    values: takePattern(valuesPool, index + 2, 3),
    preferredDates: takePattern(datePool, index + 4, 3),
    avatarColor: pick(colors, index),
  };
});
