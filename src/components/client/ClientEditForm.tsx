"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

interface Props {
  client: {
    id: string;
    name: string;
    company: string | null;
    phone: string | null;
    email: string | null;
    wechat: string | null;
    notes: string | null;
    user_id: string | null;
  };
}

export default function ClientEditForm({ client }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: client.name,
    company: client.company ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
    wechat: client.wechat ?? "",
    notes: client.notes ?? "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setLoading(true);
    const supabase = createSupabaseClient();
    await supabase.from("clients").update({
      name: form.name,
      company: form.company || null,
      phone: form.phone || null,
      email: form.email || null,
      wechat: form.wechat || null,
      notes: form.notes || null,
    }).eq("id", client.id);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  async function invitePortal() {
    if (!form.email) { alert("请先填写邮箱"); return; }
    setInviting(true);
    const res = await fetch("/api/invite-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id, email: form.email, name: form.name }),
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else alert("邀请邮件已发送！");
    setInviting(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">客户信息</h3>
      <div>
        <label className="block text-xs text-gray-500 mb-1">姓名</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">公司</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.company} onChange={(e) => set("company", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">电话</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">微信</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.wechat} onChange={(e) => set("wechat", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">邮箱（门户登录用）</label>
        <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">备注</label>
        <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={loading}
          className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {saved ? "已保存 ✓" : loading ? "保存中..." : "保存"}
        </button>
        {!client.user_id && (
          <button onClick={invitePortal} disabled={inviting}
            className="flex-1 border border-indigo-200 text-indigo-600 text-sm py-2 rounded-lg hover:bg-indigo-50 disabled:opacity-50">
            {inviting ? "发送中..." : "邀请开通门户"}
          </button>
        )}
        {client.user_id && (
          <span className="text-xs text-green-500 self-center">门户已激活</span>
        )}
      </div>
    </div>
  );
}
