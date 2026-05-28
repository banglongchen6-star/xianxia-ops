import { createClient } from "@/lib/supabase/server";
import { Project } from "@/lib/types";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  线索: "bg-gray-100 text-gray-600",
  跟进中: "bg-blue-100 text-blue-700",
  签约: "bg-purple-100 text-purple-700",
  执行中: "bg-yellow-100 text-yellow-700",
  已完成: "bg-green-100 text-green-700",
  已取消: "bg-red-100 text-red-600",
};

const STATUSES = ["线索", "跟进中", "签约", "执行中", "已完成", "已取消"];

export default async function BoardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*, clients(name, company)")
    .order("created_at", { ascending: false });

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = (projects as Project[] || []).filter((p) => p.status === s);
    return acc;
  }, {} as Record<string, Project[]>);

  const stats = {
    total: projects?.length ?? 0,
    active: projects?.filter((p) => ["跟进中", "签约", "执行中"].includes(p.status)).length ?? 0,
    done: projects?.filter((p) => p.status === "已完成").length ?? 0,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">进度看板</h2>
        <Link
          href="/dashboard/projects/new"
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + 新建项目
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">全部项目</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">进行中</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">已完成</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.done}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {["线索", "跟进中", "执行中"].map((status) => (
          <div key={status} className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>
                {status}
              </span>
              <span className="text-xs text-gray-400">{grouped[status].length} 个</span>
            </div>
            <div className="p-3 space-y-2 min-h-24">
              {grouped[status].map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projects/${p.id}`}
                  className="block bg-gray-50 rounded-lg p-3 hover:bg-indigo-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(p as any).clients?.company || (p as any).clients?.name || "—"}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{p.type}</span>
                    {p.event_date && (
                      <span className="text-xs text-gray-400">
                        {new Date(p.event_date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {grouped[status].length === 0 && (
                <p className="text-xs text-gray-300 text-center py-4">暂无项目</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {["签约", "已完成", "已取消"].map((status) => (
          <div key={status} className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>
                {status}
              </span>
              <span className="text-xs text-gray-400">{grouped[status].length} 个</span>
            </div>
            <div className="p-3 space-y-2 min-h-16">
              {grouped[status].map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projects/${p.id}`}
                  className="block bg-gray-50 rounded-lg p-3 hover:bg-indigo-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(p as any).clients?.company || (p as any).clients?.name || "—"}
                  </p>
                </Link>
              ))}
              {grouped[status].length === 0 && (
                <p className="text-xs text-gray-300 text-center py-4">暂无项目</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
