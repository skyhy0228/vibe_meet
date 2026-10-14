import { defaultUser } from "../data/profiles";
import type { AuthSession, Profile, UserAccount } from "../types";

const ACCOUNTS_KEY = "vibe-meet-accounts";
const SESSION_KEY = "vibe-meet-session";

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const hashPassword = (password: string) => btoa(unescape(encodeURIComponent(`vibe-meet:${password}`)));
const palette = ["#fb7185", "#f97316", "#facc15", "#34d399", "#2dd4bf", "#38bdf8", "#818cf8", "#a78bfa", "#e879f9", "#f472b6"];

function loadAccounts(): UserAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]") as UserAccount[];
  } catch {
    return [];
  }
}

function storeAccounts(accounts: UserAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getSession(): AuthSession | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as AuthSession | null;
  } catch {
    return null;
  }
}

export function getCurrentAccount() {
  const session = getSession();
  if (!session) return null;
  return loadAccounts().find((account) => account.id === session.accountId) || null;
}

export function getVisibleUserProfiles(currentAccountId?: string): Profile[] {
  return loadAccounts()
    .filter((account) => account.profileVisible && account.id !== currentAccountId)
    .map((account) => ({
      ...defaultUser,
      ...account.profile,
      id: `user-profile-${account.id}`,
      ownerId: account.id,
      isUser: false,
    }));
}

export function signUp(emailInput: string, password: string, displayName: string, consentAccepted: boolean) {
  const email = normalizeEmail(emailInput);
  if (!email.includes("@")) throw new Error("이메일 형식을 확인해 주세요.");
  if (password.length < 6) throw new Error("비밀번호는 6자 이상이어야 합니다.");
  if (!consentAccepted) throw new Error("서비스 이용 및 프로필 저장 안내에 동의해야 합니다.");

  const accounts = loadAccounts();
  if (accounts.some((account) => account.email === email)) throw new Error("이미 가입된 이메일입니다.");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const profile: Profile = {
    ...defaultUser,
    id: `user-${id}`,
    ownerId: id,
    name: displayName.trim() || email.split("@")[0],
    avatarColor: palette[accounts.length % palette.length],
    isUser: true,
  };
  const account: UserAccount = {
    id,
    email,
    passwordHash: hashPassword(password),
    createdAt: now,
    lastLoginAt: now,
    consentAccepted,
    profileVisible: true,
    profile,
  };
  storeAccounts([account, ...accounts]);
  const session = { accountId: id, email, signedInAt: now };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return account;
}

export function signIn(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const accounts = loadAccounts();
  const account = accounts.find((item) => item.email === email && item.passwordHash === hashPassword(password));
  if (!account) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  const next = { ...account, lastLoginAt: new Date().toISOString() };
  storeAccounts(accounts.map((item) => (item.id === next.id ? next : item)));
  localStorage.setItem(SESSION_KEY, JSON.stringify({ accountId: next.id, email: next.email, signedInAt: next.lastLoginAt }));
  return next;
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateAccountProfile(accountId: string, profile: Profile) {
  const accounts = loadAccounts();
  const account = accounts.find((item) => item.id === accountId);
  if (!account) throw new Error("로그인 정보가 만료되었습니다.");
  const next = { ...account, profile: { ...profile, id: `user-${accountId}`, ownerId: accountId, isUser: true } };
  storeAccounts(accounts.map((item) => (item.id === accountId ? next : item)));
  return next;
}

export function updateProfileVisibility(accountId: string, profileVisible: boolean) {
  const accounts = loadAccounts();
  const account = accounts.find((item) => item.id === accountId);
  if (!account) throw new Error("로그인 정보가 만료되었습니다.");
  const next = { ...account, profileVisible };
  storeAccounts(accounts.map((item) => (item.id === accountId ? next : item)));
  return next;
}

export function deleteAccount(accountId: string) {
  storeAccounts(loadAccounts().filter((account) => account.id !== accountId));
  signOut();
}
