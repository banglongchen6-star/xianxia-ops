"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban, User, Bell, Box, FolderOpen, Package, ShoppingCart, FileText,
  LogOut, Music, Phone, ChevronRight, AlertCircle, UserPlus,
} from "lucide-react";
import { partnerStore, messageStore, seedDemo } from "@/lib/ops/store";
import { inp, Field, RegionSelect } from "@/components/ops/ui";
import { Session } from "@/lib/ops/types";
import { View, Ctx } from "@/lib/ops/ctx";
import { MyProfileView } from "@/components/ops/ProfileViews";
import { ProjectsView, ProjectDetailView } from "@/components/ops/ProjectViews";
import MessagesView from "@/components/ops/MessagesView";
import SamplesView from "@/components/ops/SamplesView";
import FilesView from "@/components/ops/FilesView";
import ProductsView from "@/components/ops/ProductsView";
import PartnerOrdersView from "@/components/ops/PartnerOrdersView";
import PartnerContractsView from "@/components/ops/PartnerContractsView";

const PARTNER_SESSION_KEY = "ops_partner_pid";

// ════════════════════════════════════════════════════════════════════════
// 琴行伙伴门户 — 独立入口
// ════════════════════════════════════════════════════════════════════════
export default function PartnerPortal() {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDemo();
    const saved = localStorage.getItem(PARTNER_SESSION_KEY);
    if (saved && partnerStore.get(saved)) setPartnerId(saved);
    setReady(true);
  }, []);

  function login(id: string) {
    localStorage.setItem(PARTNER_SESSION_KEY, id);
    setPartnerId(id);
  }

  function logout() {
    localStorage.removeItem(PARTNER_SESSION_KEY);
    setPartnerId(null);
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!partnerId) {
    return <LoginPage onLogin={login} />;
  }

  return <PartnerApp partnerId={partnerId} onLogout={logout} />;
}

// ════════════════════════════════════════════════════════════════════════
// 登录 / 注册页
// ════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }: { onLogin: (id: string) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">音乐密码</h1>
          <p className="text-indigo-200 text-sm mt-1">琴行合作伙伴门户</p>
        </div>

        {/* 卡片 */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab 切换 */}
          <div className="flex border-b border-gray-100">
            {([["login", "已有账户", Phone], ["register", "新琴行注册", UserPlus]] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors
                  ${tab === id ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-400 hover:text-gray-600"}`}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "login"    && <LoginForm onLogin={onLogin} onGoRegister={() => setTab("register")} onBack={() => router.push("/")} />}
            {tab === "register" && <RegisterForm onDone={onLogin} onGoLogin={() => setTab("login")} />}
          </div>
        </div>

        <p className="text-indigo-300 text-xs text-center mt-6">
          本地预览版 · 数据仅存于当前浏览器
        </p>
      </div>
    </div>
  );
}

// ── 登录表单 ────────────────────────────────────────────────────────────
function LoginForm({ onLogin, onGoRegister, onBack }: { onLogin: (id: string) => void; onGoRegister: () => void; onBack: () => void }) {
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");

  function find() {
    if (!phone.trim()) { setErr("请输入手机号"); return; }
    const p = partnerStore.list().find(x => x.phone === phone.trim());
    if (!p) { setErr("未找到该手机号，请先注册或联系运营人员"); return; }
    onLogin(p.id);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400 mb-4">使用注册时填写的手机号登录</p>
      {err && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{err}</p>
        </div>
      )}
      <div className="relative">
        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="请输入手机号"
          value={phone}
          onChange={e => { setPhone(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && find()}
          inputMode="numeric"
        />
      </div>
      <div className="flex gap-3">
        <button onClick={find}
          className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          登录 <ChevronRight size={16} />
        </button>
        <button onClick={onBack}
          className="px-5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          返回
        </button>
      </div>
    </div>
  );
}

// ── 注册表单 ────────────────────────────────────────────────────────────
function RegisterForm({ onDone, onGoLogin }: { onDone: (id: string) => void; onGoLogin: () => void }) {
  const [form, setForm] = useState({
    contactName: "", storeName: "",
    province: "", city: "", district: "",
    phone: "", wechat: "",
  });
  const [err, setErr] = useState("");
  function s(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.contactName || !form.storeName || !form.phone) {
      setErr("负责人、琴行名称、手机号为必填"); return;
    }
    const exists = partnerStore.list().find(p => p.phone === form.phone.trim());
    if (exists) { setErr("该手机号已注册，请直接登录"); return; }
    const p = partnerStore.create({
      contactName: form.contactName, storeName: form.storeName,
      province: form.province, city: form.city, district: form.district,
      phone: form.phone.trim(), wechat: form.wechat || null,
      payeeName: null, bankCard: null, bankName: null, alipay: null,
    });
    onDone(p.id);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400 mb-2">填写基本信息，注册后直接进入</p>
      {err && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{err}</p>
        </div>
      )}
      <Field label="负责人姓名" required>
        <input className={inp} value={form.contactName} onChange={e => s("contactName", e.target.value)} placeholder="您的姓名" />
      </Field>
      <Field label="琴行/机构名称" required>
        <input className={inp} value={form.storeName} onChange={e => s("storeName", e.target.value)} placeholder="例：悦音琴行" />
      </Field>
      <Field label="所在地区">
        <RegionSelect province={form.province} city={form.city} district={form.district}
          onChange={v => setForm(f => ({ ...f, ...v }))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="手机号" required>
          <input className={inp} value={form.phone} onChange={e => s("phone", e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="微信号">
          <input className={inp} value={form.wechat} onChange={e => s("wechat", e.target.value)} />
        </Field>
      </div>
      <p className="text-xs text-gray-400">收款信息可注册后在「我的档案」补充。</p>
      <button onClick={submit}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all">
        注册并进入
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 主应用
// ════════════════════════════════════════════════════════════════════════
type PartnerView = "projects" | "project-detail" | "myprofile" | "samples" | "products" | "orders" | "contracts" | "files" | "messages";

function PartnerApp({ partnerId, onLogout }: { partnerId: string; onLogout: () => void }) {
  const [view, setView] = useState<PartnerView>("projects");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const partner = partnerStore.get(partnerId);
  const session: Session = { role: "partner", partnerId };

  useEffect(() => {
    const handler = () => setVersion(v => v + 1);
    window.addEventListener("ops-store-change", handler);
    return () => window.removeEventListener("ops-store-change", handler);
  }, []);

  const unread = useMemo(() => messageStore.unreadCount(partnerId), [version, partnerId]);
  const refresh = useCallback(() => setVersion(v => v + 1), []);

  function go(v: View, id?: string) {
    setView(v as PartnerView);
    setSelectedId(id ?? null);
  }

  const ctx: Ctx = { session, refresh, go, selectedId };

  const nav: { id: PartnerView; label: string; icon: any; badge?: number }[] = [
    { id: "projects",   label: "活动中心", icon: FolderKanban },
    { id: "samples",    label: "样品物料", icon: Box },
    { id: "products",   label: "产品&提成", icon: Package },
    { id: "orders",     label: "订单&结算", icon: ShoppingCart },
    { id: "contracts",  label: "合同&签订", icon: FileText },
    { id: "files",      label: "文件中心", icon: FolderOpen },
    { id: "myprofile",  label: "用户档案", icon: User },
    { id: "messages",   label: "消息",     icon: Bell, badge: unread },
  ];

  const isActive = (id: PartnerView) =>
    view === id || (id === "projects" && view === "project-detail");


  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0 shadow-sm">
        {/* Header */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Music size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">{partner?.storeName ?? "我的琴行"}</h1>
              <p className="text-xs text-gray-400 truncate">{partner?.contactName}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => go(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-colors ${isActive(id) ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <Icon size={16} className={isActive(id) ? "text-indigo-600" : "text-gray-400"} />
              <span className="flex-1 text-left">{label}</span>
              {!!badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-5 text-center">{badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button onClick={onLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={15} />退出登录
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-13 bg-white border-b border-gray-100 flex items-center px-6 shrink-0">
          <p className="text-sm text-gray-400">
            合作伙伴门户 · <span className="text-gray-700 font-medium">{partner?.storeName}</span>
          </p>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {view === "myprofile"  && <MyProfileView ctx={ctx} />}
          {view === "projects"   && <ProjectsView ctx={ctx} />}
          {view === "project-detail" && <ProjectDetailView ctx={ctx} />}
          {view === "samples"    && <SamplesView ctx={ctx} />}
          {view === "products"   && <ProductsView ctx={ctx} />}
          {view === "orders"     && <PartnerOrdersView ctx={ctx} />}
          {view === "contracts"  && <PartnerContractsView ctx={ctx} />}
          {view === "files"      && <FilesView ctx={ctx} />}
          {view === "messages"   && <MessagesView ctx={ctx} />}
        </main>
      </div>
    </div>
  );
}
