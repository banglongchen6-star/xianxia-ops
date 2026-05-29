"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, FolderKanban, User, Bell, Box, FolderOpen,
  LogOut, Music, Phone, ChevronRight, AlertCircle,
} from "lucide-react";
import { partnerStore, messageStore, seedDemo } from "@/lib/ops/store";
import { Session } from "@/lib/ops/types";
import { View, Ctx } from "@/lib/ops/ctx";
import HomeView from "@/components/ops/HomeView";
import { MyProfileView } from "@/components/ops/ProfileViews";
import { ProjectsView, ProjectDetailView } from "@/components/ops/ProjectViews";
import MessagesView from "@/components/ops/MessagesView";
import SamplesView from "@/components/ops/SamplesView";
import FilesView from "@/components/ops/FilesView";

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
// 登录页 — 手机号查找
// ════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }: { onLogin: (id: string) => void }) {
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");

  function find() {
    if (!phone.trim()) { setErr("请输入手机号"); return; }
    const partners = partnerStore.list();
    const p = partners.find(x => x.phone === phone.trim());
    if (!p) { setErr("未找到该手机号对应的琴行，请联系音乐密码运营人员"); return; }
    onLogin(p.id);
  }

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

        {/* 登录卡片 */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">登录账户</h2>
          <p className="text-sm text-gray-400 mb-5">使用注册时填写的手机号登录</p>

          {err && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{err}</p>
            </div>
          )}

          <div className="space-y-3">
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
            <button onClick={find}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              登录 <ChevronRight size={16} />
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-5">
            未注册？请联系音乐密码运营人员添加您的琴行
          </p>
        </div>

        <p className="text-indigo-300 text-xs text-center mt-6">
          本地预览版 · 数据仅存于当前浏览器
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 主应用
// ════════════════════════════════════════════════════════════════════════
type PartnerView = "home" | "projects" | "project-detail" | "myprofile" | "samples" | "files" | "messages";

function PartnerApp({ partnerId, onLogout }: { partnerId: string; onLogout: () => void }) {
  const [view, setView] = useState<PartnerView>("home");
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
    { id: "home", label: "首页", icon: LayoutDashboard },
    { id: "projects", label: "我的项目", icon: FolderKanban },
    { id: "myprofile", label: "我的档案", icon: User },
    { id: "samples", label: "样品物料", icon: Box },
    { id: "files", label: "文件中心", icon: FolderOpen },
    { id: "messages", label: "消息", icon: Bell, badge: unread },
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
          {view === "home" && <HomeView ctx={ctx} />}
          {view === "projects" && <ProjectsView ctx={ctx} />}
          {view === "project-detail" && <ProjectDetailView ctx={ctx} />}
          {view === "myprofile" && <MyProfileView ctx={ctx} />}
          {view === "samples" && <SamplesView ctx={ctx} />}
          {view === "files" && <FilesView ctx={ctx} />}
          {view === "messages" && <MessagesView ctx={ctx} />}
        </main>
      </div>
    </div>
  );
}
