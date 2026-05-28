"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    wechat: "",
    notes: "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { setError("姓名为必填项"); return; }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.from("clients").insert({
      name: form.name,
      company: form.company || null,
      phone: form.phone || null,
      email: form.email || null,
      wechat: form.wechat || null,
      notes: form.notes || null,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/dashboard/clients");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="联系人姓名" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">公司/机构</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="例：XX商业广场" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="138..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">微信</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.wechat} onChange={(e) => set("wechat", e.target.value)} placeholder="微信号" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
        <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="用于开通门户账号" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="客户来源、背景..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "保存中..." : "创建客户"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-sm px-5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
          取消
        </button>
      </div>
    </form>
  );
}
