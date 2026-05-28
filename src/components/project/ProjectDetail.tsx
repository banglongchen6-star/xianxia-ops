"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Project, ProjectFile, FollowUp, FileCategory } from "@/lib/types";
import FileUpload from "@/components/file/FileUpload";
import FileList from "@/components/file/FileList";

const STATUS_COLOR: Record<string, string> = {
  线索: "bg-gray-100 text-gray-600",
  跟进中: "bg-blue-100 text-blue-700",
  签约: "bg-purple-100 text-purple-700",
  执行中: "bg-yellow-100 text-yellow-700",
  已完成: "bg-green-100 text-green-700",
  已取消: "bg-red-100 text-red-600",
};

const STATUSES = ["线索", "跟进中", "签约", "执行中", "已完成", "已取消"];

interface Props {
  project: Project & { clients: any };
  files: ProjectFile[];
  followUps: FollowUp[];
  userId: string;
}

export default function ProjectDetail({ project, files, followUps, userId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(project.status);
  const [followUpText, setFollowUpText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localFollowUps, setLocalFollowUps] = useState(followUps);

  async function updateStatus(newStatus: string) {
    setStatus(newStatus);
    const supabase = createClient();
    await supabase.from("projects").update({ status: newStatus }).eq("id", project.id);
    router.refresh();
  }

  async function addFollowUp() {
    if (!followUpText.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("follow_ups")
      .insert({ project_id: project.id, content: followUpText, created_by: userId })
      .select()
      .single();
    if (data) {
      setLocalFollowUps([data, ...localFollowUps]);
      setFollowUpText("");
    }
    setSubmitting(false);
  }

  const client = project.clients;

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{project.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) => updateStatus(e.target.value)}
                className={`text-xs font-medium px-3 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLOR[status]}`}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <a
                href={`/dashboard/projects/${project.id}/edit`}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-200 rounded-lg"
              >
                编辑
              </a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">客户</p>
              <p className="text-gray-700 mt-0.5">{client?.company || client?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">地点</p>
              <p className="text-gray-700 mt-0.5">{project.venue || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">活动日期</p>
              <p className="text-gray-700 mt-0.5">
                {project.event_date
                  ? new Date(project.event_date).toLocaleDateString("zh-CN")
                  : "—"}
              </p>
            </div>
          </div>
          {project.notes && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              {project.notes}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">文件资料</h3>
          <FileUpload projectId={project.id} userId={userId} />
          <div className="mt-4">
            <FileList files={files} isAdmin={true} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">跟进记录</h3>
          <div className="flex gap-2 mb-4">
            <textarea
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              rows={2}
              placeholder="记录跟进内容..."
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
            />
            <button
              onClick={addFollowUp}
              disabled={submitting}
              className="bg-indigo-600 text-white text-sm px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              记录
            </button>
          </div>
          <div className="space-y-3">
            {localFollowUps.map((f) => (
              <div key={f.id} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{f.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(f.created_at).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {localFollowUps.length === 0 && (
              <p className="text-xs text-gray-300">暂无跟进记录</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">联系人</h3>
          {client ? (
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-400">姓名</p>
                <p className="text-gray-700">{client.name}</p>
              </div>
              {client.company && (
                <div>
                  <p className="text-xs text-gray-400">公司</p>
                  <p className="text-gray-700">{client.company}</p>
                </div>
              )}
              {client.phone && (
                <div>
                  <p className="text-xs text-gray-400">电话</p>
                  <a href={`tel:${client.phone}`} className="text-indigo-600">{client.phone}</a>
                </div>
              )}
              {client.wechat && (
                <div>
                  <p className="text-xs text-gray-400">微信</p>
                  <p className="text-gray-700">{client.wechat}</p>
                </div>
              )}
              <a
                href={`/dashboard/clients/${client.id}`}
                className="inline-block text-xs text-indigo-500 hover:underline mt-1"
              >
                查看完整档案 →
              </a>
            </div>
          ) : (
            <p className="text-xs text-gray-400">未关联客户</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">文件统计</h3>
          {["物料", "合同", "报价单", "宣传资料"].map((cat) => {
            const count = files.filter((f) => f.category === cat).length;
            return (
              <div key={cat} className="flex justify-between items-center py-1.5 text-sm border-b border-gray-50 last:border-0">
                <span className="text-gray-500">{cat}</span>
                <span className={`font-medium ${count > 0 ? "text-indigo-600" : "text-gray-300"}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
