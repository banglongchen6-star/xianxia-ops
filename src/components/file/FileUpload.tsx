"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FileCategory } from "@/lib/types";
import { Upload } from "lucide-react";

const CATEGORIES: FileCategory[] = ["物料", "合同", "报价单", "宣传资料", "其他"];

export default function FileUpload({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<FileCategory>("物料");
  const [isClientVisible, setIsClientVisible] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setError("");
    const supabase = createClient();

    for (const file of Array.from(fileList)) {
      const path = `${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("project-files")
        .upload(path, file);

      if (uploadErr) {
        setError(uploadErr.message);
        setUploading(false);
        return;
      }

      await supabase.from("project_files").insert({
        project_id: projectId,
        name: file.name,
        category,
        storage_path: path,
        size: file.size,
        uploaded_by: userId,
        is_client_visible: isClientVisible,
      });
    }

    setUploading(false);
    router.refresh();
  }

  return (
    <div className="border border-dashed border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as FileCategory)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isClientVisible}
            onChange={(e) => setIsClientVisible(e.target.checked)}
            className="rounded"
          />
          客户可见
        </label>
      </div>

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
      >
        <Upload size={14} />
        {uploading ? "上传中..." : "点击上传文件"}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
