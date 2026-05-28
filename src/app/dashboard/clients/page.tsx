import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*, projects(id)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">客户管理</h2>
        <Link
          href="/dashboard/clients/new"
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + 新建客户
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {(clients || []).map((c: any) => (
          <Link
            key={c.id}
            href={`/dashboard/clients/${c.id}`}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                {c.company && <p className="text-xs text-gray-400 mt-0.5">{c.company}</p>}
              </div>
              <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                {c.projects?.length ?? 0} 个项目
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              {c.phone && <p>📞 {c.phone}</p>}
              {c.wechat && <p>💬 {c.wechat}</p>}
              {c.email && <p>✉️ {c.email}</p>}
            </div>
            {c.user_id ? (
              <p className="text-xs text-green-500 mt-3">已激活门户账号</p>
            ) : (
              <p className="text-xs text-gray-300 mt-3">未开通门户</p>
            )}
          </Link>
        ))}
        {(!clients || clients.length === 0) && (
          <div className="col-span-3 text-center py-16 text-gray-400 text-sm">
            暂无客户，点击右上角新建
          </div>
        )}
      </div>
    </div>
  );
}
