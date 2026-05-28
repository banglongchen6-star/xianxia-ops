"use client";
import { Partner, Project, Message, Session, ProjectStatus, MediaItem } from "./types";

// ── 工具 ──────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function now() { return new Date().toISOString(); }

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new Event("ops-store-change"));
}

const K = { partners: "ops_partners", projects: "ops_projects", messages: "ops_messages", session: "ops_session" };

// ── 图片压缩（避免 localStorage 爆容量）──────────────────────────────────
export function compressImage(file: File, maxSize = 1000, quality = 0.7): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
          else { width = Math.round(width * maxSize / height); height = maxSize; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve({ id: uid(), name: file.name, dataUrl: canvas.toDataURL("image/jpeg", quality) });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── 会话（当前身份）────────────────────────────────────────────────────
export const sessionStore = {
  get(): Session { return load<Session>(K.session, { role: "company", partnerId: null }); },
  set(s: Session) { save(K.session, s); },
};

// ── 琴行 ──────────────────────────────────────────────────────────────
export const partnerStore = {
  list(): Partner[] { return load<Partner[]>(K.partners, []); },
  get(id: string | null) { return id ? this.list().find(p => p.id === id) ?? null : null; },
  create(data: Omit<Partner, "id" | "createdAt">): Partner {
    const rec: Partner = { ...data, id: uid(), createdAt: now() };
    const all = this.list(); all.push(rec); save(K.partners, all); return rec;
  },
  update(id: string, data: Partial<Partner>) {
    save(K.partners, this.list().map(p => p.id === id ? { ...p, ...data } : p));
  },
  delete(id: string) { save(K.partners, this.list().filter(p => p.id !== id)); },
};

// ── 项目 ──────────────────────────────────────────────────────────────
type NewProject = {
  partnerId: string; title: string; province: string; city: string; district: string;
  venue: string; eventDate?: string; planStart?: string; planEnd?: string; douyinAccount: string;
  status?: ProjectStatus;
};

export const projectStore = {
  list(): Project[] { return load<Project[]>(K.projects, []); },
  get(id: string | null) { return id ? this.list().find(p => p.id === id) ?? null : null; },
  byPartner(pid: string) { return this.list().filter(p => p.partnerId === pid); },
  create(data: NewProject): Project {
    const rec: Project = {
      id: uid(), partnerId: data.partnerId, title: data.title,
      province: data.province, city: data.city, district: data.district, venue: data.venue,
      eventDate: data.eventDate || null, planStart: data.planStart || null, planEnd: data.planEnd || null,
      douyinAccount: data.douyinAccount, status: data.status || "草稿", rejectReason: null,
      liveStart: null, liveEnd: null, liveClips: [], scenePhotos: [],
      createdAt: now(), updatedAt: now(),
    };
    const all = this.list(); all.push(rec); save(K.projects, all); return rec;
  },
  update(id: string, data: Partial<Project>) {
    save(K.projects, this.list().map(p => p.id === id ? { ...p, ...data, updatedAt: now() } : p));
  },
  delete(id: string) { save(K.projects, this.list().filter(p => p.id !== id)); },
};

// ── 站内消息 ──────────────────────────────────────────────────────────
export const messageStore = {
  list(): Message[] { return load<Message[]>(K.messages, []); },
  forRecipient(r: string) { return this.list().filter(m => m.recipient === r).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  unreadCount(r: string) { return this.list().filter(m => m.recipient === r && !m.read).length; },
  send(recipient: string, title: string, body: string, link: string | null = null) {
    const rec: Message = { id: uid(), recipient, title, body, link, read: false, createdAt: now() };
    const all = this.list(); all.push(rec); save(K.messages, all); return rec;
  },
  markRead(id: string) {
    save(K.messages, this.list().map(m => m.id === id ? { ...m, read: true } : m));
  },
  markAllRead(r: string) {
    save(K.messages, this.list().map(m => m.recipient === r ? { ...m, read: true } : m));
  },
};

// ── 演示数据填充 ──────────────────────────────────────────────────────
export function seedDemo() {
  if (partnerStore.list().length > 0) return;
  const p1 = partnerStore.create({
    contactName: "张丽", storeName: "悦音琴行", province: "广东省", city: "广州市", district: "天河区",
    phone: "13800001111", wechat: "yueyin_zhang", payeeName: "张丽", bankCard: "6222 **** **** 1234",
    bankName: "工商银行广州天河支行", alipay: null,
  });
  const p2 = partnerStore.create({
    contactName: "王强", storeName: "和弦钢琴中心", province: "浙江省", city: "杭州市", district: "西湖区",
    phone: "13900002222", wechat: null, payeeName: null, bankCard: null, bankName: null, alipay: null,
  });
  projectStore.create({
    partnerId: p1.id, title: "天河城周末钢琴路演", province: "广东省", city: "广州市", district: "天河区",
    venue: "天河城购物中心 B1 中庭", eventDate: "2026-06-14", planStart: "14:00", planEnd: "17:00",
    douyinAccount: "yueyin_live", status: "待审核",
  });
  projectStore.create({
    partnerId: p2.id, title: "西湖银泰路演", province: "浙江省", city: "杭州市", district: "西湖区",
    venue: "西湖银泰城一楼广场", eventDate: "2026-06-20", planStart: "15:00", planEnd: "18:00",
    douyinAccount: "hexian_piano", status: "草稿",
  });
  messageStore.send("company", "新活动待审核", "悦音琴行 提交了「天河城周末钢琴路演」，请审核", null);
}
