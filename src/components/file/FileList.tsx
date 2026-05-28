"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProjectFile } from "@/lib/types";
import { FileText, Download, Trash2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

const CATEGORY_COLOR: Record<string, string> = {
  物料: "bg-blue-50 text-blue-600",
  合同: "bg-purple-50 text-purple-600",
  报价单: "bg-yellow-50 text-yellow-700",
  宣传资料: "bg-green-50 text-green-600",
  其他: "bg-gray-50 text-gray-500",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function FileList({
  files,
  isAdmin,
}: {
  files: ProjectFile[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);

  async function download(file: ProjectFile) {
    setDownloading(file.id);
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(file.storage_path, 300);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = file.name;
      a.click();
    }
    setDownloading(null);
  }

  async function toggleVisibility(file: ProjectFile) {
    const supabase = createClient();
    await supabase
      .from("project_files")
      .update({ is_client_visible: !file.is_client_visible })
      .eq("id", file.id);
    router.refresh();
  }

  async function deleteFile(file: ProjectFile) {
    if (!confirm(`确认删除「${file.name}」？`)) return;
    const supabase = createClient();
    await supabase.storage.from("project-files").remove([file.storage_path]);
    await supabase.from("project_files").delete().eq("id", file.id);
    router.refresh();
  }

  if (files.length === 0) {
    return <p className="text-xs text-gray-300 py-2">暂无文件</p>;
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FileText size={16} className="text-gray-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 truncate">{file.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_COLOR[file.category]}`}>
                {file.category}
              </span>
              {file.size && <span className="text-xs text-gray-400">{formatSize(file.size)}</span>}
              {isAdmin && !file.is_client_visible && (
                <span className="text-xs text-gray-400">（仅内部）</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => download(file)}
              disabled={downloading === file.id}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
              title="下载"
            >
              <Download size={14} />
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => toggleVisibility(file)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title={file.is_client_visible ? "对客户可见（点击隐藏）" : "对客户隐藏（点击显示）"}
                >
                  {file.is_client_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => deleteFile(file)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
