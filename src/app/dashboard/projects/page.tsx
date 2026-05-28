import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Project } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  线索: "bg-gray-100 text-gray-600",
  跟进中: "bg-blue-100 text-blue-700",
  签约: "bg-purple-100 text-purple-700",
  执行中: "bg-yellow-100 text-yellow-700",
  已完成: "bg-green-100 text-green-700",
  已取消: "bg-red-100 text-red-600",
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*, clients(name, company)")
    .order("updated_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">项目中心</h2>
        <Link
          href="/dashboard/projects/new"
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + 新建项目
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">项目名称</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">客户</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">类型</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">状态</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">活动日期</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">更新时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(projects as any[] || []).map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/projects/${p.id}`} className="text-indigo-600 hover:underline font-medium">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {p.clients?.company || p.clients?.name || "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.type}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {p.event_date ? new Date(p.event_date).toLocaleDateString("zh-CN") : "—"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(p.updated_at).toLocaleDateString("zh-CN")}
                </td>
              </tr>
            ))}
            {(!projects || projects.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                  暂无项目，点击右上角新建
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
