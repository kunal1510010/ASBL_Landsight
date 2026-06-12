export const CREDENTIALS = { email: "admin@asbl.in", password: "asbl2026" };
const KEY = "landsight.authed";
export const isAuthed = () => localStorage.getItem(KEY) === "1";
export const login = (e: string, p: string) => {
  const ok = e === CREDENTIALS.email && p === CREDENTIALS.password;
  if (ok) localStorage.setItem(KEY, "1");
  return ok;
};
export const logout = () => localStorage.removeItem(KEY);
