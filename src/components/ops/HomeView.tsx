"use client";
import { useMemo } from "react";
import { Ctx } from "@/lib/ops/ctx";
import { projectStore, partnerStore, messageStore } from "@/lib/ops/store";
import { StatusBadge } from "./ui";
import { ClipboardCheck, Wallet, FolderKanban, Bell } from "lucide-react";

export default function HomeView({ ctx }: { ctx: Ctx }) {
  const isCompany = ctx.session.role === "company";
  const all = useMemo(() => projectStore.list(), []);
  const mine = useMemo(
    () => isCompany ? all : all.filter(p => p.partnerId === ctx.session.partnerId),
    [all, isCompany, ctx.session.partnerId]
  );

  if (isCompany) {
    const settling = all.filter(p => p.status === "待结算");
    const running = all.filter(p => p.status === "执行中");
    const cards = [
      { label: "执行中活动", value: running.length, icon: FolderKanban, color: "text-blue-600", items: running },
      { label: "待结算活动", value: settling.length, icon: Wallet, color: "text-purple-600", items: settling },
    ];
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">待办看板</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{c.label}</p>
                <c.icon size={16} className={c.color} />
              </div>
              <p className={`text-3xl font-bold mt-2 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TodoList title="执行中" items={cards[0].items} ctx={ctx} />
          <TodoList title="待结算" items={cards[1].items} ctx={ctx} />
        </div>
      </div>
    );
  }

  // 琴行首页
  const unread = messageStore.unreadCount(ctx.session.partnerId ?? "");
  const counts = {
    草稿: mine.filter(p => p.status === "草稿").length,
    待审核: mine.filter(p => p.status === "待审核").length,
    执行中: mine.filter(p => p.status === "执行中").length,
    待结算: mine.filter(p => p.status === "待结算").length,
  };
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">我的运营概览</h2>
      <p className="text-sm text-gray-400 mb-6">{partnerStore.get(ctx.session.partnerId)?.storeName}</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">{k}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{v}</p>
          </div>
        ))}
      </div>

      {unread > 0 && (
        <button onClick={() => ctx.go("messages")}
          className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-3 rounded-xl mb-6 w-full">
          <Bell size={15} />你有 {unread} 条未读消息，点击查看
        </button>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">最近活动</h3>
          <button onClick={() => ctx.go("projects")} className="text-xs text-indigo-500 hover:underline">查看全部 →</button>
        </div>
        <div className="space-y-2">
          {mine.length === 0 && <p className="text-sm text-gray-300 py-4 text-center">还没有活动，去「我的项目」新建一个</p>}
          {mine.slice(0, 5).map(p => (
            <button key={p.id} onClick={() => ctx.go("project-detail", p.id)}
              className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors text-left">
              <div>
                <p className="text-sm text-gray-800">{p.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.city} {p.district} · {p.eventDate || "日期待定"}</p>
              </div>
              <StatusBadge status={p.status} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TodoList({ title, items, ctx }: { title: string; items: any[]; ctx: Ctx }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-gray-300 py-3 text-center">暂无</p>}
        {items.map(p => {
          const partner = partnerStore.get(p.partnerId);
          return (
            <button key={p.id} onClick={() => ctx.go("project-detail", p.id)}
              className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors text-left">
              <div>
                <p className="text-sm text-gray-800">{p.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{partner?.storeName} · {p.city}</p>
              </div>
              <StatusBadge status={p.status} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
