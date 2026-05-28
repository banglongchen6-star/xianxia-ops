"use client";
import { Project, Client, ProjectFile, FollowUp, ProjectStatus, ProjectType, FileCategory } from "./types";

// ── 工具 ──────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function now() { return new Date().toISOString(); }

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

// ── Clients ───────────────────────────────────────────
export const clientStore = {
  list(): Client[] { return load("clients", []); },
  get(id: string) { return this.list().find(c => c.id === id) ?? null; },
  create(data: Omit<Client, "id" | "created_at" | "user_id">): Client {
    const rec: Client = { ...data, id: uid(), created_at: now(), user_id: null };
    const all = this.list(); all.push(rec); save("clients", all); return rec;
  },
  update(id: string, data: Partial<Client>) {
    const all = this.list().map(c => c.id === id ? { ...c, ...data } : c);
    save("clients", all);
  },
  delete(id: string) { save("clients", this.list().filter(c => c.id !== id)); },
};

// ── Projects ──────────────────────────────────────────
export const projectStore = {
  list(): Project[] { return load("projects", []); },
  get(id: string) { return this.list().find(p => p.id === id) ?? null; },
  create(data: { name: string; type: ProjectType; status: ProjectStatus; client_id: string; venue?: string; event_date?: string; notes?: string }): Project {
    const rec: Project = { ...data, id: uid(), venue: data.venue || null, event_date: data.event_date || null, notes: data.notes || null, created_at: now(), updated_at: now() };
    const all = this.list(); all.push(rec); save("projects", all); return rec;
  },
  update(id: string, data: Partial<Project>) {
    const all = this.list().map(p => p.id === id ? { ...p, ...data, updated_at: now() } : p);
    save("projects", all);
  },
  delete(id: string) { save("projects", this.list().filter(p => p.id !== id)); },
};

// ── Files ─────────────────────────────────────────────
export interface LocalFile extends Omit<ProjectFile, "storage_path" | "uploaded_by"> {
  dataUrl: string; // base64
}

export const fileStore = {
  list(): LocalFile[] { return load("files", []); },
  byProject(pid: string) { return this.list().filter(f => f.project_id === pid); },
  add(data: Omit<LocalFile, "id" | "created_at">): LocalFile {
    const rec: LocalFile = { ...data, id: uid(), created_at: now() };
    const all = this.list(); all.push(rec); save("files", all); return rec;
  },
  toggleVisible(id: string) {
    const all = this.list().map(f => f.id === id ? { ...f, is_client_visible: !f.is_client_visible } : f);
    save("files", all);
  },
  delete(id: string) { save("files", this.list().filter(f => f.id !== id)); },
};

// ── FollowUps ─────────────────────────────────────────
export const followUpStore = {
  list(): FollowUp[] { return load("followups", []); },
  byProject(pid: string) { return this.list().filter(f => f.project_id === pid).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
  add(project_id: string, content: string): FollowUp {
    const rec: FollowUp = { id: uid(), project_id, content, created_by: "admin", created_at: now() };
    const all = this.list(); all.push(rec); save("followups", all); return rec;
  },
  delete(id: string) { save("followups", this.list().filter(f => f.id !== id)); },
};
