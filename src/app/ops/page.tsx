"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, Users, Bell,
  Package, Box, FolderOpen, Building2,
} from "lucide-react";
import { useOps } from "@/lib/ops/useOps";
import { messageStore } from "@/lib/ops/store";
import HomeView from "@/components/ops/HomeView";
import { PartnersView, PartnerDetailView } from "@/components/ops/ProfileViews";
import { ProjectsView, ProjectDetailView } from "@/components/ops/ProjectViews";
import MessagesView from "@/components/ops/MessagesView";
import ProductsView from "@/components/ops/ProductsView";
import SamplesView from "@/components/ops/SamplesView";
import FilesView from "@/components/ops/FilesView";

export type { View, Ctx } from "@/lib/ops/ctx";
import type { View, Ctx } from "@/lib/ops/ctx";

const COMPANY_SESSION = { role: "company" as const, partnerId: null };

const NAV = [
  { id: "home",     icon: LayoutDashboard, label: "待办看板" },
  { id: "projects", icon: FolderKanban,    label: "项目中心" },
  { id: "partners", icon: Users,           label: "用户档案" },
  { id: "products", icon: Package,         label: "产品管理" },
  { id: "samples",  icon: Box,             label: "样品物料" },
  { id: "files",    icon: FolderOpen,      label: "文件中心" },
  { id: "messages", icon: Bell,            label: "消息"     },
] as const;

export default function OpsApp() {
  const router = useRouter();
  const { refresh, version, ready } = useOps();
  const [view, setView] = useState<View>("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("ops_company_auth") !== "1") {
      router.replace("/");
    }
  }, [router]);

  const unread = useMemo(() => messageStore.unreadCount("company"), [version]);

  function go(v: View, id?: string) {
    setView(v);
    setSelectedId(id ?? null);
  }

  const ctx: Ctx = { session: COMPANY_SESSION, refresh, go, selectedId };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        加载中…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-700">
          <h1 className="text-sm font-bold text-white">线下运营管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">音乐密码 · 公司管理端</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ id, icon: Icon, label }) => {
            const badge = id === "messages" ? unread : 0;
            const active =
              view === id ||
              (id === "projects" && view === "project-detail") ||
              (id === "partners" && view === "partner-detail");
            return (
              <button key={id} onClick={() => go(id as View)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors
                  ${active ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`}>
                <Icon size={16} />
                <span className="flex-1 text-left">{label}</span>
                {!!badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-5 text-center">
                    {badge}
                  </span>
                )}
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
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Building2 size={15} className="text-indigo-500" />
            <span className="font-medium text-gray-700">公司管理端</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {view === "home"           && <HomeView ctx={ctx} />}
          {view === "projects"       && <ProjectsView ctx={ctx} />}
          {view === "project-detail" && <ProjectDetailView ctx={ctx} />}
          {view === "partners"       && <PartnersView ctx={ctx} />}
          {view === "partner-detail" && <PartnerDetailView ctx={ctx} />}
          {view === "messages"       && <MessagesView ctx={ctx} />}
          {view === "products"       && <ProductsView ctx={ctx} />}
          {view === "samples"        && <SamplesView ctx={ctx} />}
          {view === "files"          && <FilesView ctx={ctx} />}
        </main>
      </div>
    </div>
  );
}
