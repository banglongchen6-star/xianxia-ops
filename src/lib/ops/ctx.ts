// 共享 Ctx 类型 — 供 /ops 和 /partner 两端复用
import { Session } from "./types";

export type View =
  | "home" | "projects" | "project-detail"
  | "partners" | "partner-detail" | "myprofile" | "messages"
  | "products" | "samples" | "files";

export interface Ctx {
  session: Session;
  refresh: () => void;
  go: (view: View, id?: string) => void;
  selectedId: string | null;
}
