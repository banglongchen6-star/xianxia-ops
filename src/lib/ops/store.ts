"use client";
import {
  Partner, Project, Message, Session, ProjectStatus, MediaItem,
  Product, Order, OrderItem, Settlement,
  Sample, Material, ActivityMaterial, Contract,
  ResourceCategory, ResourceFile,
} from "./types";

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

const K = {
  partners: "ops_partners", projects: "ops_projects", messages: "ops_messages", session: "ops_session",
  products: "ops_products", orders: "ops_orders", settlements: "ops_settlements",
  samples: "ops_samples", materials: "ops_materials", activityMaterials: "ops_activity_materials",
  contracts: "ops_contracts",
  resourceCategories: "ops_resource_categories", resourceFiles: "ops_resource_files",
};

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

// ── 产品 ──────────────────────────────────────────────────────────────
export const productStore = {
  list(): Product[] { return load<Product[]>(K.products, []); },
  get(id: string | null) { return id ? this.list().find(p => p.id === id) ?? null : null; },
  create(data: Omit<Product, "id" | "createdAt">): Product {
    const rec: Product = { ...data, id: uid(), createdAt: now() };
    const all = this.list(); all.push(rec); save(K.products, all); return rec;
  },
  update(id: string, data: Partial<Product>) {
    save(K.products, this.list().map(p => p.id === id ? { ...p, ...data } : p));
  },
  delete(id: string) { save(K.products, this.list().filter(p => p.id !== id)); },
};

// ── 订单 ──────────────────────────────────────────────────────────────
export const orderStore = {
  list(): Order[] { return load<Order[]>(K.orders, []); },
  get(id: string | null) { return id ? this.list().find(o => o.id === id) ?? null : null; },
  byProject(projectId: string) { return this.list().filter(o => o.projectId === projectId); },
  create(data: Omit<Order, "id" | "createdAt">): Order {
    const rec: Order = { ...data, id: uid(), createdAt: now() };
    const all = this.list(); all.push(rec); save(K.orders, all); return rec;
  },
  update(id: string, data: Partial<Order>) {
    save(K.orders, this.list().map(o => o.id === id ? { ...o, ...data } : o));
  },
  delete(id: string) { save(K.orders, this.list().filter(o => o.id !== id)); },
};

// ── 结算单 ──────────────────────────────────────────────────────────
export const settlementStore = {
  list(): Settlement[] { return load<Settlement[]>(K.settlements, []); },
  byProject(projectId: string) { return this.list().find(s => s.projectId === projectId) ?? null; },
  upsert(projectId: string, data: Omit<Settlement, "id" | "createdAt">): Settlement {
    const existing = this.byProject(projectId);
    if (existing) {
      save(K.settlements, this.list().map(s => s.projectId === projectId ? { ...s, ...data } : s));
      return { ...existing, ...data };
    }
    const rec: Settlement = { ...data, id: uid(), createdAt: now() };
    const all = this.list(); all.push(rec); save(K.settlements, all); return rec;
  },
};

// ── 样品 ──────────────────────────────────────────────────────────────
export const sampleStore = {
  list(): Sample[] { return load<Sample[]>(K.samples, []); },
  get(id: string | null) { return id ? this.list().find(s => s.id === id) ?? null : null; },
  create(data: Omit<Sample, "id" | "createdAt">): Sample {
    const rec: Sample = { ...data, id: uid(), createdAt: now() };
    const all = this.list(); all.push(rec); save(K.samples, all); return rec;
  },
  update(id: string, data: Partial<Sample>) {
    save(K.samples, this.list().map(s => s.id === id ? { ...s, ...data } : s));
  },
  delete(id: string) { save(K.samples, this.list().filter(s => s.id !== id)); },
};

// ── 物料主库 ──────────────────────────────────────────────────────────
export const materialStore = {
  list(): Material[] { return load<Material[]>(K.materials, []); },
  get(id: string | null) { return id ? this.list().find(m => m.id === id) ?? null : null; },
  create(data: Omit<Material, "id" | "createdAt">): Material {
    const rec: Material = { ...data, id: uid(), createdAt: now() };
    const all = this.list(); all.push(rec); save(K.materials, all); return rec;
  },
  update(id: string, data: Partial<Material>) {
    save(K.materials, this.list().map(m => m.id === id ? { ...m, ...data } : m));
  },
  delete(id: string) { save(K.materials, this.list().filter(m => m.id !== id)); },
};

// ── 活动物料清单 ──────────────────────────────────────────────────────
export const activityMaterialStore = {
  list(): ActivityMaterial[] { return load<ActivityMaterial[]>(K.activityMaterials, []); },
  byProject(projectId: string) { return this.list().filter(m => m.projectId === projectId); },
  create(data: Omit<ActivityMaterial, "id" | "createdAt">): ActivityMaterial {
    const rec: ActivityMaterial = { ...data, id: uid(), createdAt: now() };
    const all = this.list(); all.push(rec); save(K.activityMaterials, all); return rec;
  },
  update(id: string, data: Partial<ActivityMaterial>) {
    save(K.activityMaterials, this.list().map(m => m.id === id ? { ...m, ...data } : m));
  },
  delete(id: string) { save(K.activityMaterials, this.list().filter(m => m.id !== id)); },
};

// ── 合同 ──────────────────────────────────────────────────────────────
export const contractStore = {
  list(): Contract[] { return load<Contract[]>(K.contracts, []); },
  byProject(projectId: string) { return this.list().find(c => c.projectId === projectId) ?? null; },
  upsert(projectId: string, data: Omit<Contract, "id" | "createdAt">): Contract {
    const existing = this.byProject(projectId);
    if (existing) {
      save(K.contracts, this.list().map(c => c.projectId === projectId ? { ...c, ...data } : c));
      return { ...existing, ...data };
    }
    const rec: Contract = { ...data, id: uid(), createdAt: now() };
    const all = this.list(); all.push(rec); save(K.contracts, all); return rec;
  },
};

// ── 文件分类 ──────────────────────────────────────────────────────────
export const resourceCategoryStore = {
  list(): ResourceCategory[] { return load<ResourceCategory[]>(K.resourceCategories, []); },
  create(name: string): ResourceCategory {
    const rec: ResourceCategory = { id: uid(), name, createdAt: now() };
    const all = this.list(); all.push(rec); save(K.resourceCategories, all); return rec;
  },
  update(id: string, name: string) {
    save(K.resourceCategories, this.list().map(c => c.id === id ? { ...c, name } : c));
  },
  delete(id: string) {
    save(K.resourceCategories, this.list().filter(c => c.id !== id));
    // 同时删除该分类下的文件
    save(K.resourceFiles, resourceFileStore.list().filter(f => f.categoryId !== id));
  },
};

// ── 文件 ──────────────────────────────────────────────────────────────
export const resourceFileStore = {
  list(): ResourceFile[] { return load<ResourceFile[]>(K.resourceFiles, []); },
  byCategory(categoryId: string) { return this.list().filter(f => f.categoryId === categoryId); },
  create(data: Omit<ResourceFile, "id" | "createdAt">): ResourceFile {
    const rec: ResourceFile = { ...data, id: uid(), createdAt: now() };
    const all = this.list(); all.push(rec); save(K.resourceFiles, all); return rec;
  },
  delete(id: string) { save(K.resourceFiles, this.list().filter(f => f.id !== id)); },
};

// ── 文件转 dataUrl（通用，不压缩）──────────────────────────────────────
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

  // 演示产品
  if (productStore.list().length === 0) {
    productStore.create({ name: "音乐密码智能钢琴课程", model: "MK-PRO-1Y", price: 3980, commissionType: "percent", commissionValue: 15, description: "一年期智能课程，含AI陪练+直播课", stock: 999 });
    productStore.create({ name: "音乐密码家庭版套装", model: "MK-HOME-A", price: 5980, commissionType: "fixed", commissionValue: 800, description: "含智能钢琴+一年课程+教材", stock: 50 });
    productStore.create({ name: "音乐密码半年课", model: "MK-HALF-1", price: 2180, commissionType: "percent", commissionValue: 12, description: "半年智能课程", stock: 999 });
  }

  // 演示物料主库
  if (materialStore.list().length === 0) {
    materialStore.create({ name: "易拉宝", category: "宣传物料", notes: "2米高，展示品牌形象" });
    materialStore.create({ name: "产品宣传册", category: "宣传物料", notes: "A4折页，每次带50份" });
    materialStore.create({ name: "桌布", category: "展台物料", notes: "带Logo蓝色桌布" });
    materialStore.create({ name: "音响设备", category: "演出设备", notes: "便携蓝牙音响" });
  }

  // 演示文件分类
  if (resourceCategoryStore.list().length === 0) {
    resourceCategoryStore.create("产品资料");
    resourceCategoryStore.create("活动话术");
    resourceCategoryStore.create("培训材料");
  }
}
