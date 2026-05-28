"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

interface Props {
  clients: ClientOption[];
  project?: {
    id: string;
    name: string;
    type: string;
    status: string;
    client_id: string;
    venue: string | null;
    event_date: string | null;
    notes: string | null;
  };
}

const PROJECT_TYPES = ["体验课活动", "商务合作", "演出展览"];
const PROJECT_STATUSES = ["线索", "跟进中", "签约", "执行中", "已完成", "已取消"];

export default function ProjectForm({ clients, project }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: project?.name ?? "",
    type: project?.type ?? "体验课活动",
    status: project?.status ?? "线索",
    client_id: project?.client_id ?? "",
    venue: project?.venue ?? "",
    event_date: project?.event_date ?? "",
    notes: project?.notes ?? "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.client_id) {
      setError("项目名称和客户为必填项");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const payload = {
      name: form.name,
      type: form.type,
      status: form.status,
      client_id: form.client_id,
      venue: form.venue || null,
      event_date: form.event_date || null,
      notes: form.notes || null,
    };

    const { error: err } = project
      ? await supabase.from("projects").update(payload).eq("id", project.id)
      : await supabase.from("projects").insert(payload);

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard/projects");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
        <input
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="例：XX学校钢琴体验日"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">活动类型 *</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">当前状态 *</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">关联客户 *</label>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.client_id}
          onChange={(e) => set("client_id", e.target.value)}
        >
          <option value="">请选择客户</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company ? `${c.company} - ${c.name}` : c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          没有客户？先去{" "}
          <a href="/dashboard/clients" className="text-indigo-500 hover:underline">客户管理</a>
          {" "}新建
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">活动地点</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.venue}
            onChange={(e) => set("venue", e.target.value)}
            placeholder="例：XX商场B1广场"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">活动日期</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.event_date}
            onChange={(e) => set("event_date", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="其他补充说明..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "保存中..." : project ? "保存修改" : "创建项目"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm px-5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}
