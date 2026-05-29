"use client";
import { useMemo } from "react";
import { Ctx } from "@/lib/ops/ctx";
import { messageStore } from "@/lib/ops/store";
import { EmptyState } from "./ui";
import { Bell } from "lucide-react";

export default function MessagesView({ ctx }: { ctx: Ctx }) {
  const recipient = ctx.session.role === "company" ? "company" : (ctx.session.partnerId ?? "");
  const messages = useMemo(() => messageStore.forRecipient(recipient), [recipient]);
  const hasUnread = messages.some(m => !m.read);

  function open(id: string, link: string | null) {
    messageStore.markRead(id);
    ctx.refresh();
    if (link) ctx.go("project-detail", link);
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">消息</h2>
        {hasUnread && (
          <button onClick={() => { messageStore.markAllRead(recipient); ctx.refresh(); }}
            className="text-xs text-indigo-500 hover:underline">全部标为已读</button>
        )}
      </div>
      <div className="space-y-2">
        {messages.length === 0 && <EmptyState text="暂无消息" />}
        {messages.map(m => (
          <button key={m.id} onClick={() => open(m.id, m.link)}
            className={`flex gap-3 w-full p-4 rounded-xl border text-left transition-colors ${m.read ? "bg-white border-gray-100" : "bg-indigo-50 border-indigo-100"}`}>
            <div className={`mt-0.5 ${m.read ? "text-gray-300" : "text-indigo-500"}`}><Bell size={16} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm ${m.read ? "text-gray-700" : "text-gray-900 font-medium"}`}>{m.title}</p>
                {!m.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{m.body}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
