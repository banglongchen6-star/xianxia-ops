"use client";
import { useState, useMemo } from "react";
import {
  LayoutDashboard, FolderKanban, Users, User, Bell, Building2, ChevronDown, Plus,
} from "lucide-react";
import { useOps } from "@/lib/ops/useOps";
import { partnerStore, projectStore, messageStore } from "@/lib/ops/store";
import { Session } from "@/lib/ops/types";
import HomeView from "@/components/ops/HomeView";
import { PartnersView, PartnerDetailView, MyProfileView } from "@/components/ops/ProfileViews";
import { ProjectsView, ProjectDetailView } from "@/components/ops/ProjectViews";
import MessagesView from "@/components/ops/MessagesView";
import RegisterPartnerModal from "@/components/ops/RegisterPartnerModal";

export type View =
  | "home" | "projects" | "project-detail"
  | "partners" | "partner-detail" | "myprofile" | "messages";

export interface Ctx {
  session: Session;
  refresh: () => void;
  go: (view: View, id?: string) => void;
  selectedId: string | null;
}

export default function OpsApp() {
  const { session, setSession, refresh, version, ready } = useOps();
  const [view, setView] = useState<View>("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const partners = useMemo(() => partnerStore.list(), [version, ready]);
  const isCompany = session.role === "company";
  const me = partnerStore.get(session.partnerId);

  const recipient = isCompany ? "company" : (session.partnerId ?? "");
  const unread = useMemo(() => messageStore.unreadCount(recipient), [version, ready, recipient]);

  function go(v: View, id?: string) {
    setView(v);
    setSelectedId(id ?? null);
  }

  function switchTo(s: Session) {
    setSession(s);
    setSwitcherOpen(false);
    setView("home");
    setSelectedId(null);
  }

  const ctx: Ctx = { session, refresh, go, selectedId };

  const nav = isCompany
    ? [
        { id: "home", icon: LayoutDashboard, label: "待办看板" },
        { id: "projects", icon: FolderKanban, label: "项目中心" },
        { id: "partners", icon: Users, label: "用户档案" },
        { id: "messages", icon: Bell, label: "消息", badge: unread },
      ]
    : [
        { id: "home", icon: LayoutDashboard, label: "首页" },
        { id: "projects", icon: FolderKanban, label: "我的项目" },
        { id: "myprofile", icon: User, label: "我的档案" },
        { id: "messages", icon: Bell, label: "消息", badge: unread },
      ];

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">加载中…</div>;
  }

  // 琴行身份但未选具体琴行
  if (!isCompany && !me) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">请在右上角选择琴行身份</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-700">
          <h1 className="text-sm font-bold text-white">线下运营管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">音乐密码</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ id, icon: Icon, label, badge }) => {
            const active = view === id ||
              (id === "projects" && view === "project-detail") ||
              (id === "partners" && view === "partner-detail");
            return (
              <button key={id} onClick={() => go(id as View)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors ${active ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`}>
                <Icon size={16} />
                <span className="flex-1 text-left">{label}</span>
                {!!badge && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-5 text-center">{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
          本地预览版 · 数据存浏览器
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar with role switcher */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-end px-6 shrink-0 relative">
          <div className="relative">
            <button onClick={() => setSwitcherOpen(o => !o)}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
              {isCompany ? <Building2 size={15} className="text-indigo-500" /> : <User size={15} className="text-indigo-500" />}
              <span className="text-gray-700">{isCompany ? "公司管理端" : me?.storeName}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {switcherOpen && (
              <div className="absolute right-0 top-full mt-1 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                <p className="px-3 py-1.5 text-xs text-gray-400">切换身份预览</p>
                <button onClick={() => switchTo({ role: "company", partnerId: null })}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 ${isCompany ? "text-indigo-600" : "text-gray-700"}`}>
                  <Building2 size={15} />公司管理端
                </button>
                <div className="border-t border-gray-50 my-1" />
                {partners.map(p => (
                  <button key={p.id} onClick={() => switchTo({ role: "partner", partnerId: p.id })}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 ${session.partnerId === p.id ? "text-indigo-600" : "text-gray-700"}`}>
                    <User size={15} />{p.storeName}
                  </button>
                ))}
                <div className="border-t border-gray-50 my-1" />
                <button onClick={() => { setRegisterOpen(true); setSwitcherOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-indigo-500 hover:bg-gray-50">
                  <Plus size={15} />注册新琴行
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {view === "home" && <HomeView ctx={ctx} />}
          {view === "projects" && <ProjectsView ctx={ctx} />}
          {view === "project-detail" && <ProjectDetailView ctx={ctx} />}
          {view === "partners" && isCompany && <PartnersView ctx={ctx} />}
          {view === "partner-detail" && isCompany && <PartnerDetailView ctx={ctx} />}
          {view === "myprofile" && !isCompany && <MyProfileView ctx={ctx} />}
          {view === "messages" && <MessagesView ctx={ctx} />}
        </main>
      </div>

      {registerOpen && (
        <RegisterPartnerModal
          onClose={() => setRegisterOpen(false)}
          onDone={(id) => { setRegisterOpen(false); switchTo({ role: "partner", partnerId: id }); go("myprofile"); }}
        />
      )}
    </div>
  );
}
