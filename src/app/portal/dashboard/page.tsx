import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FileList from "@/components/file/FileList";
import PortalHeader from "@/components/layout/PortalHeader";

const STATUS_COLOR: Record<string, string> = {
  线索: "bg-gray-100 text-gray-600",
  跟进中: "bg-blue-100 text-blue-700",
  签约: "bg-purple-100 text-purple-700",
  执行中: "bg-yellow-100 text-yellow-700",
  已完成: "bg-green-100 text-green-700",
  已取消: "bg-red-100 text-red-600",
};

export default async function PortalDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: client } = await supabase
    .from("clients")
    .select("*, projects(*, project_files(*))")
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">账号尚未关联客户档案，请联系运营人员</p>
      </div>
    );
  }

  const projects = client.projects || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PortalHeader clientName={client.company || client.name} />

      <div className="mt-8 space-y-6">
        {projects.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">暂无项目，运营人员创建后会通知您</p>
          </div>
        )}
        {projects.map((project: any) => (
          <div key={project.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{project.type}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[project.status]}`}>
                {project.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">活动地点</p>
                <p className="text-gray-700 mt-0.5 font-medium">{project.venue || "待确认"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">活动日期</p>
                <p className="text-gray-700 mt-0.5 font-medium">
                  {project.event_date
                    ? new Date(project.event_date).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })
                    : "待确认"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">文件数量</p>
                <p className="text-gray-700 mt-0.5 font-medium">
                  {project.project_files?.filter((f: any) => f.is_client_visible).length ?? 0} 个
                </p>
              </div>
            </div>

            {project.notes && (
              <div className="bg-indigo-50 rounded-lg px-4 py-3 mb-4 text-sm text-indigo-700">
                {project.notes}
              </div>
            )}

            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">可下载资料</h4>
              <FileList
                files={project.project_files?.filter((f: any) => f.is_client_visible) || []}
                isAdmin={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
