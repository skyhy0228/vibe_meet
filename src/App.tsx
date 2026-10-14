import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Brain, Moon, Play, Save, Search, Sparkles, Sun, Trash2, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { defaultFilters, defaultUser, defaultWeights, profiles } from "./data/profiles";
import { categoryLabel, normalizeWeights, runMatching } from "./lib/matching";
import { clearHistory, loadHistory, saveHistory } from "./lib/storage";
import type { CandidateMatch, CategoryKey, ContactStyle, Gender, HardFilters, MatchHistory, Profile, Religion, Smoking, Weights } from "./types";

const regions = ["서울", "경기", "인천", "부산", "대전", "대구", "광주", "제주"];
const interests = ["여행", "영화", "러닝", "전시", "와인", "등산", "요리", "독서", "재즈", "사진", "캠핑", "수영", "보드게임", "뮤지컬", "카페", "반려식물", "클라이밍", "테니스"];
const values = ["성장", "배려", "정직", "안정", "자유", "유머", "가족", "성취", "신뢰", "대화"];
const dateTypes = ["전시", "맛집", "산책", "드라이브", "공연", "등산", "홈쿠킹", "카페", "스포츠", "야경"];
const tabs = ["대시보드", "내 프로필", "조건 설정", "매칭 결과", "비교 분석", "기록/테스트"] as const;

type Tab = (typeof tabs)[number];

export function App() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState<Tab>("대시보드");
  const [user, setUser] = useState<Profile>(() => {
    const saved = localStorage.getItem("vibe-meet-user");
    return saved ? { ...defaultUser, ...JSON.parse(saved) } : defaultUser;
  });
  const [filters, setFilters] = useState<HardFilters>(defaultFilters);
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  const [history, setHistory] = useState<MatchHistory[]>(loadHistory());
  const [savedNotice, setSavedNotice] = useState("");
  const [compareIds, setCompareIds] = useState<[string, string]>(["", ""]);
  const result = useMemo(() => runMatching(user, profiles, filters, weights), [user, filters, weights]);
  const normalized = normalizeWeights(weights);
  const top = result.topFive[0];
  const chartData = result.topFive.map((match) => ({ name: match.profile.name, score: match.totalScore, ...match.scores }));
  const comparison = compareIds.map((id) => result.matches.find((match) => match.profile.id === id)).filter(Boolean) as CandidateMatch[];

  const persistUser = (next: Profile) => {
    setUser(next);
    localStorage.setItem("vibe-meet-user", JSON.stringify(next));
  };

  const saveCurrentHistory = () => {
    const next = saveHistory(filters, weights, result.topFive.map((match) => ({ id: match.profile.id, name: match.profile.name, score: match.totalScore })));
    setHistory([next, ...history].slice(0, 12));
    setSavedNotice("현재 매칭 결과를 저장했습니다.");
    window.setTimeout(() => setSavedNotice(""), 1800);
  };

  const applyScenario = (scenario: string) => {
    if (scenario === "normal") {
      setFilters(defaultFilters);
      setWeights(defaultWeights);
    }
    if (scenario === "strict") setFilters({ ...defaultFilters, regions: ["제주"], minAge: 30, maxAge: 31, minHeight: 185, smoking: "비흡연", religion: "불교" });
    if (scenario === "none") setFilters({ ...defaultFilters, minAge: 60, maxAge: 65, minHeight: 195, maxHeight: 205 });
    if (scenario === "tie") setFilters({ ...defaultFilters, smoking: "상관없음", religion: "상관없음", regions: [] });
    if (scenario === "values") setWeights({ personality: 10, interests: 10, values: 60, dateStyle: 10, contact: 10 });
    if (scenario === "low") setFilters({ ...defaultFilters, gender: "상관없음", regions: ["광주"], smoking: "흡연", religion: "기타" });
    setTab("매칭 결과");
  };

  return (
    <main className={dark ? "app dark" : "app"}>
      <header className="topbar">
        <div>
          <p className="eyebrow">AI 스타일 로컬 매칭 시스템</p>
          <h1>Vibe Meet</h1>
        </div>
        <nav>
          {tabs.map((item) => (
            <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>
          ))}
        </nav>
        <button className="iconButton" onClick={() => setDark(!dark)} title="테마 전환">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
      </header>

      <AnimatePresence mode="wait">
        <motion.section key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
          {tab === "대시보드" && <Dashboard result={result} top={top} setTab={setTab} history={history} />}
          {tab === "내 프로필" && <ProfileEditor user={user} persistUser={persistUser} />}
          {tab === "조건 설정" && <ConditionPanel filters={filters} setFilters={setFilters} weights={weights} setWeights={setWeights} result={result} normalized={normalized} />}
          {tab === "매칭 결과" && <Results result={result} chartData={chartData} saveCurrentHistory={saveCurrentHistory} savedNotice={savedNotice} />}
          {tab === "비교 분석" && <Compare result={result} compareIds={compareIds} setCompareIds={setCompareIds} comparison={comparison} />}
          {tab === "기록/테스트" && <HistoryAndTests history={history} setHistory={setHistory} applyScenario={applyScenario} />}
        </motion.section>
      </AnimatePresence>
    </main>
  );
}

function Dashboard({ result, top, setTab, history }: { result: ReturnType<typeof runMatching>; top?: CandidateMatch; setTab: (tab: Tab) => void; history: MatchHistory[] }) {
  return (
    <div className="grid dashboard">
      <section className="hero">
        <div>
          <p className="eyebrow">필터링부터 추천 이유까지</p>
          <h2>조건을 바꾸면 매칭 결과가 즉시 다시 계산됩니다.</h2>
          <p>외부 AI API 없이 로컬 데이터와 투명한 점수 계산으로 TOP 5 추천, 설명, 비교, 기록까지 제공합니다.</p>
          <div className="heroActions">
            <button className="primary" onClick={() => setTab("매칭 결과")}><Search size={18} /> 바로 검색</button>
            <button className="secondary" onClick={() => setTab("조건 설정")}><Play size={18} /> 조건 조정</button>
          </div>
        </div>
      </section>
      <Metric icon={<Users />} label="가상 프로필" value={`${profiles.length}명`} />
      <Metric icon={<Sparkles />} label="필터 통과" value={`${result.eligibleProfiles}명`} />
      <Metric icon={<BarChart3 />} label="현재 1위" value={top ? `${top.profile.name} ${top.totalScore}점` : "없음"} />
      <section className="panel wide">
        <h3>최근 매칭 기록</h3>
        {history.length ? history.slice(0, 3).map((item) => <p key={item.id}>{new Date(item.createdAt).toLocaleString("ko-KR")} · {item.topFive[0]?.name} {item.topFive[0]?.score}점</p>) : <p>아직 저장된 기록이 없습니다.</p>}
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <section className="panel metric">{icon}<span>{label}</span><strong>{value}</strong></section>;
}

function ProfileEditor({ user, persistUser }: { user: Profile; persistUser: (user: Profile) => void }) {
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => persistUser({ ...user, [key]: value });
  const progress = Math.min(100, ["name", "age", "gender", "height", "weight", "region", "job", "mbti", "interests", "values", "bio"].filter((key) => Boolean(user[key as keyof Profile])).length * 9);
  return (
    <div className="panel">
      <div className="sectionHead"><h2>내 프로필</h2><span>{progress}% 완료</span></div>
      <div className="progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="formGrid">
        <Field label="이름"><input value={user.name} onChange={(e) => update("name", e.target.value)} /></Field>
        <Field label="나이"><input type="number" value={user.age} onChange={(e) => update("age", Number(e.target.value))} /></Field>
        <Field label="성별"><Select value={user.gender} onChange={(v) => update("gender", v as Gender)} options={["여성", "남성", "논바이너리"]} /></Field>
        <Field label="키"><input type="number" value={user.height} onChange={(e) => update("height", Number(e.target.value))} /></Field>
        <Field label="몸무게"><input type="number" value={user.weight} onChange={(e) => update("weight", Number(e.target.value))} /></Field>
        <Field label="지역"><Select value={user.region} onChange={(v) => update("region", v)} options={regions} /></Field>
        <Field label="직업"><input value={user.job} onChange={(e) => update("job", e.target.value)} /></Field>
        <Field label="MBTI"><input value={user.mbti} maxLength={4} onChange={(e) => update("mbti", e.target.value.toUpperCase())} /></Field>
        <Field label="종교"><Select value={user.religion} onChange={(v) => update("religion", v as Religion)} options={["무교", "기독교", "천주교", "불교", "기타"]} /></Field>
        <Field label="외향성"><input type="range" min="1" max="5" value={user.extroversion} onChange={(e) => update("extroversion", Number(e.target.value))} /></Field>
        <Field label="활동 데이트"><input type="range" min="1" max="5" value={user.activeDate} onChange={(e) => update("activeDate", Number(e.target.value))} /></Field>
        <Field label="연락 빈도"><Select value={user.contactStyle} onChange={(v) => update("contactStyle", v as ContactStyle)} options={["낮음", "보통", "높음"]} /></Field>
        <Field label="흡연"><Select value={user.smoking} onChange={(v) => update("smoking", v as Smoking)} options={["비흡연", "가끔", "흡연"]} /></Field>
        <Field label="음주"><Select value={user.drinking} onChange={(v) => update("drinking", v as Profile["drinking"])} options={["안함", "가끔", "즐김"]} /></Field>
        <Field label="취미"><ChipPicker values={interests} selected={user.interests} onChange={(next) => update("interests", next)} /></Field>
        <Field label="가치관"><ChipPicker values={values} selected={user.values} onChange={(next) => update("values", next)} /></Field>
        <Field label="데이트 유형"><ChipPicker values={dateTypes} selected={user.preferredDates} onChange={(next) => update("preferredDates", next)} /></Field>
      </div>
      <label className="textareaLabel">자기소개<textarea value={user.bio} onChange={(e) => update("bio", e.target.value)} /></label>
    </div>
  );
}

function ConditionPanel({ filters, setFilters, weights, setWeights, result, normalized }: {
  filters: HardFilters; setFilters: (filters: HardFilters) => void; weights: Weights; setWeights: (weights: Weights) => void; result: ReturnType<typeof runMatching>; normalized: Weights;
}) {
  const set = <K extends keyof HardFilters>(key: K, value: HardFilters[K]) => setFilters({ ...filters, [key]: value });
  return (
    <div className="split">
      <section className="panel">
        <h2>필수 조건</h2>
        <div className="formGrid">
          <Field label="성별"><Select value={filters.gender} onChange={(v) => set("gender", v as HardFilters["gender"])} options={["상관없음", "여성", "남성", "논바이너리"]} /></Field>
          <Field label="나이"><RangePair min={filters.minAge} max={filters.maxAge} setMin={(v) => set("minAge", v)} setMax={(v) => set("maxAge", v)} /></Field>
          <Field label="키"><RangePair min={filters.minHeight} max={filters.maxHeight} setMin={(v) => set("minHeight", v)} setMax={(v) => set("maxHeight", v)} /></Field>
          <Field label="몸무게"><RangePair min={filters.minWeight} max={filters.maxWeight} setMin={(v) => set("minWeight", v)} setMax={(v) => set("maxWeight", v)} /></Field>
          <Field label="지역"><ChipPicker values={regions} selected={filters.regions} onChange={(v) => set("regions", v)} /></Field>
          <Field label="흡연"><Select value={filters.smoking} onChange={(v) => set("smoking", v as HardFilters["smoking"])} options={["상관없음", "비흡연", "가끔", "흡연"]} /></Field>
          <Field label="종교"><Select value={filters.religion} onChange={(v) => set("religion", v as HardFilters["religion"])} options={["상관없음", "무교", "기독교", "천주교", "불교", "기타"]} /></Field>
        </div>
      </section>
      <section className="panel">
        <h2>선호 가중치</h2>
        {(Object.keys(weights) as CategoryKey[]).map((key) => (
          <label className="weight" key={key}>
            <span>{categoryLabel[key]} <b>{Math.round(normalized[key])}%</b></span>
            <input type="range" min="0" max="60" value={weights[key]} onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })} />
          </label>
        ))}
      </section>
      <section className="panel wide">
        <h2>후보자 수 미리보기</h2>
        <div className="pipeline">{result.steps.map((step) => <div key={step.key}><strong>{step.after}</strong><span>{step.label}</span><small>-{step.removed}</small></div>)}</div>
      </section>
    </div>
  );
}

function Results({ result, chartData, saveCurrentHistory, savedNotice }: { result: ReturnType<typeof runMatching>; chartData: Record<string, number | string>[]; saveCurrentHistory: () => void; savedNotice: string }) {
  if (!result.eligibleProfiles) {
    return <section className="panel empty"><h2>조건에 맞는 후보가 없습니다.</h2>{result.emptyReasons.map((reason) => <p key={reason}>{reason}</p>)}</section>;
  }
  return (
    <div className="results">
      <section className="panel winner">
        <div className="sectionHead"><h2>1위 추천</h2><button className="secondary" onClick={saveCurrentHistory}><Save size={16} /> 기록 저장</button></div>
        {savedNotice && <p className="notice">{savedNotice}</p>}
        <MatchCard match={result.topFive[0]} featured />
      </section>
      <section className="panel">
        <h2>TOP 5 점수 비교</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Legend /><Bar dataKey="score" name="전체 점수" fill="#ec4899" /></BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="cards">
        {result.topFive.map((match) => <MatchCard key={match.profile.id} match={match} />)}
      </section>
      <section className="panel wide">
        <h2>매칭 과정</h2>
        <div className="flow"><span>전체 {result.totalProfiles}명</span>{result.steps.map((step) => <span key={step.key}>{step.label} 통과 {step.after}명</span>)}<span>최종 TOP 5</span></div>
      </section>
    </div>
  );
}

function MatchCard({ match, featured = false }: { match: CandidateMatch; featured?: boolean }) {
  return (
    <article className={featured ? "matchCard featured" : "matchCard"}>
      <div className="avatar" style={{ background: match.profile.avatarColor }}>{match.profile.name.slice(0, 1)}</div>
      <div className="matchMain">
        <div className="sectionHead"><h3>{match.rank}위 · {match.profile.name}</h3><strong>{match.totalScore}점</strong></div>
        <p>{match.profile.age}세 · {match.profile.height}cm · {match.profile.weight}kg · {match.profile.region} · {match.profile.job} · {match.profile.mbti}</p>
        <p>{match.reason}</p>
        <div className="chips">{match.commonInterests.map((item) => <span key={item}>{item}</span>)}</div>
      </div>
    </article>
  );
}

function Compare({ result, compareIds, setCompareIds, comparison }: {
  result: ReturnType<typeof runMatching>; compareIds: [string, string]; setCompareIds: (ids: [string, string]) => void; comparison: CandidateMatch[];
}) {
  const radarData = (Object.keys(categoryLabel) as CategoryKey[]).map((key) => ({
    item: categoryLabel[key],
    [comparison[0]?.profile.name || "A"]: comparison[0]?.scores[key] || 0,
    [comparison[1]?.profile.name || "B"]: comparison[1]?.scores[key] || 0,
  }));
  return (
    <div className="split">
      <section className="panel">
        <h2>프로필 비교</h2>
        <div className="formGrid">
          <Select value={compareIds[0]} onChange={(v) => setCompareIds([v, compareIds[1]])} options={["", ...result.matches.map((m) => m.profile.id)]} labels={Object.fromEntries(result.matches.map((m) => [m.profile.id, `${m.profile.name} ${m.totalScore}점`]))} />
          <Select value={compareIds[1]} onChange={(v) => setCompareIds([compareIds[0], v])} options={["", ...result.matches.map((m) => m.profile.id)]} labels={Object.fromEntries(result.matches.map((m) => [m.profile.id, `${m.profile.name} ${m.totalScore}점`]))} />
        </div>
        {comparison.map((match) => <MatchCard key={match.profile.id} match={match} />)}
      </section>
      <section className="panel">
        <h2>항목별 레이더</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}><PolarGrid /><PolarAngleAxis dataKey="item" /><PolarRadiusAxis domain={[0, 100]} /><Radar dataKey={comparison[0]?.profile.name || "A"} stroke="#ec4899" fill="#ec4899" fillOpacity={0.25} /><Radar dataKey={comparison[1]?.profile.name || "B"} stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.2} /><Legend /></RadarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="panel wide">
        <h2>알고리즘 설명</h2>
        <p>필수 조건은 후보를 완전히 제외하는 하드 필터입니다. 통과한 후보에게만 성격, 관심사, 가치관, 데이트 스타일, 연락 패턴 점수를 0~100으로 계산합니다.</p>
        <p>최종 점수는 정규화된 가중치와 항목별 점수의 가중합입니다. 동점자는 가치관 점수, 나이, 프로필 ID 순서로 결정됩니다.</p>
      </section>
    </div>
  );
}

function HistoryAndTests({ history, setHistory, applyScenario }: { history: MatchHistory[]; setHistory: (history: MatchHistory[]) => void; applyScenario: (scenario: string) => void }) {
  const clear = () => { clearHistory(); setHistory([]); };
  return (
    <div className="split">
      <section className="panel">
        <div className="sectionHead"><h2>매칭 기록</h2><button className="iconButton" onClick={clear} title="기록 삭제"><Trash2 size={18} /></button></div>
        {history.length ? history.map((item) => <article className="history" key={item.id}><strong>{new Date(item.createdAt).toLocaleString("ko-KR")}</strong><p>{item.topFive.map((m) => `${m.name} ${m.score}점`).join(" · ")}</p></article>) : <p>저장된 기록이 없습니다.</p>}
      </section>
      <section className="panel">
        <h2>테스트 모드</h2>
        <div className="scenarioGrid">
          <button onClick={() => applyScenario("normal")}>일반 매칭</button>
          <button onClick={() => applyScenario("strict")}>엄격한 조건</button>
          <button onClick={() => applyScenario("none")}>후보 없음</button>
          <button onClick={() => applyScenario("tie")}>동점 확인</button>
          <button onClick={() => applyScenario("values")}>가치관 가중치</button>
          <button onClick={() => applyScenario("low")}>낮은 점수</button>
        </div>
      </section>
      <section className="panel wide">
        <h2><Brain size={20} /> 점수 계산 공식</h2>
        <p>최종 점수 = Σ(항목별 점수 × 정규화 가중치). 관심사와 가치관은 교집합/합집합 기반 유사도, 성향은 수치 차이 정규화, MBTI는 자리별 일치 점수로 계산합니다.</p>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Select({ value, onChange, options, labels = {} }: { value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{labels[option] || option || "선택"}</option>)}</select>;
}

function RangePair({ min, max, setMin, setMax }: { min: number; max: number; setMin: (value: number) => void; setMax: (value: number) => void }) {
  return <div className="rangePair"><input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} /><input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} /></div>;
}

function ChipPicker({ values, selected, onChange }: { values: string[]; selected: string[]; onChange: (selected: string[]) => void }) {
  return (
    <div className="chips picker">
      {values.map((value) => {
        const active = selected.includes(value);
        return <button type="button" className={active ? "selected" : ""} key={value} onClick={() => onChange(active ? selected.filter((item) => item !== value) : [...selected, value])}>{value}</button>;
      })}
    </div>
  );
}
