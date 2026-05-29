"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Ctx } from "@/lib/ops/ctx";
import {
  SbCategory, SbFile,
  fetchCategories, fetchFiles,
  addCategory, renameCategory, removeCategory,
  uploadFile, removeFile,
} from "@/lib/supabase/files";
import { inp, Field, Btn, Modal, EmptyState } from "./ui";
import { Plus, Trash2, Download, FolderOpen, FileText, Image, Film, File, Pencil, Loader2 } from "lucide-react";

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return <Image size={18} className="text-blue-400" />;
  if (mime.startsWith("video/")) return <Film size={18} className="text-purple-400" />;
  if (mime.includes("pdf")) return <FileText size={18} className="text-red-400" />;
  return <File size={18} className="text-gray-400" />;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ════════════════════════════════════════════════════════════════════════
// 文件中心（Supabase 版）
// ════════════════════════════════════════════════════════════════════════
export default function FilesView({ ctx }: { ctx: Ctx }) {
  const isCompany = ctx.session.role === "company";
  const [categories, setCategories] = useState<SbCategory[]>([]);
  const [files, setFiles] = useState<SbFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editCat, setEditCat] = useState<SbCategory | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, fs] = await Promise.all([
        fetchCategories(),
        fetchFiles(selectedCat),
      ]);
      setCategories(cats);
      setFiles(fs);
    } finally {
      setLoading(false);
    }
  }, [selectedCat]);

  useEffect(() => { reload(); }, [reload]);

  async function handleDeleteCategory(cat: SbCategory) {
    const count = files.filter(f => f.category_id === cat.id).length;
    if (count > 0 && !confirm(`删除分类「${cat.name}」会同时删除其中 ${count} 个文件，确认吗？`)) return;
    await removeCategory(cat.id);
    if (selectedCat === cat.id) setSelectedCat(null);
    else await reload();
  }

  const activeCat = selectedCat ? categories.find(c => c.id === selectedCat) : null;

  if (loading && categories.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
        <Loader2 size={16} className="animate-spin" />加载中…
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">文件中心</h2>
        {isCompany && (
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => { setEditCat(null); setCatFormOpen(true); }}>
              <span className="flex items-center gap-1.5"><Plus size={14} />新建分类</span>
            </Btn>
            {categories.length > 0 && (
              <Btn onClick={() => setUploadOpen(true)}>
                <span className="flex items-center gap-1.5"><Plus size={14} />上传文件</span>
              </Btn>
            )}
          </div>
        )}
      </div>

      {!loading && categories.length === 0 && (
        <EmptyState text={isCompany ? "暂无分类，请先新建文件分类" : "暂无资料"} />
      )}

      {categories.length > 0 && (
        <div className="flex gap-6 min-h-[500px]">
          {/* 左侧分类列表 */}
          <div className="w-48 shrink-0 space-y-1">
            <button
              onClick={() => setSelectedCat(null)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors
                ${!selectedCat ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              <FolderOpen size={15} />
              <span className="flex-1 text-left">全部文件</span>
              <span className="text-xs opacity-60">{files.length}</span>
            </button>
            {categories.map(cat => {
              const count = files.filter(f => f.category_id === cat.id).length;
              const active = selectedCat === cat.id;
              return (
                <div key={cat.id}
                  className={`flex items-center gap-1 rounded-lg transition-colors
                    ${active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  <button onClick={() => setSelectedCat(cat.id)}
                    className="flex items-center gap-2 flex-1 px-3 py-2 text-sm text-left">
                    <FolderOpen size={15} />
                    <span className="flex-1 truncate">{cat.name}</span>
                    <span className="text-xs opacity-60">{count}</span>
                  </button>
                  {isCompany && (
                    <div className="flex pr-1">
                      <button onClick={() => { setEditCat(cat); setCatFormOpen(true); }}
                        className={`p-1 rounded hover:opacity-80 ${active ? "text-white" : "text-gray-400"}`}>
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => handleDeleteCategory(cat)}
                        className={`p-1 rounded hover:opacity-80 ${active ? "text-white" : "text-gray-400"}`}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 右侧文件列表 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">
                {activeCat?.name ?? "全部文件"}
                <span className="text-xs text-gray-400 ml-2">{files.length} 个文件</span>
              </p>
              {isCompany && activeCat && (
                <Btn onClick={() => setUploadOpen(true)}>
                  <span className="flex items-center gap-1.5"><Plus size={14} />上传到此分类</span>
                </Btn>
              )}
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                <Loader2 size={13} className="animate-spin" />刷新中…
              </div>
            )}
            {!loading && files.length === 0 && <EmptyState text="此分类暂无文件" />}

            <div className="grid grid-cols-1 gap-2">
              {files.map(f => (
                <FileCard key={f.id} file={f} isCompany={isCompany}
                  categoryName={categories.find(c => c.id === f.category_id)?.name ?? ""}
                  onDelete={async () => { await removeFile(f.id, f.storage_path); await reload(); }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {catFormOpen && (
        <CategoryFormModal
          category={editCat}
          onClose={() => setCatFormOpen(false)}
          onDone={async () => { setCatFormOpen(false); await reload(); }}
        />
      )}

      {uploadOpen && (
        <UploadModal
          categories={categories}
          defaultCategoryId={selectedCat ?? undefined}
          onClose={() => setUploadOpen(false)}
          onDone={async () => { setUploadOpen(false); await reload(); }}
        />
      )}
    </div>
  );
}

// ── 文件卡片 ────────────────────────────────────────────────────────────
function FileCard({ file: f, isCompany, categoryName, onDelete }: {
  file: SbFile; isCompany: boolean; categoryName: string; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-indigo-100 transition-colors">
      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
        {fileIcon(f.mime_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {categoryName} · {fmtSize(f.size)} · {new Date(f.created_at).toLocaleDateString("zh-CN")}
        </p>
        {f.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{f.description}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <a href={f.url} target="_blank" rel="noreferrer" download={f.name}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-50">
          <Download size={13} />下载
        </a>
        {isCompany && (
          <button onClick={() => { if (confirm(`删除「${f.name}」？`)) onDelete(); }}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── 分类表单 ────────────────────────────────────────────────────────────
function CategoryFormModal({ category, onClose, onDone }: {
  category: SbCategory | null; onClose: () => void; onDone: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) { setErr("请填写分类名称"); return; }
    setSaving(true);
    try {
      if (category) await renameCategory(category.id, name.trim());
      else await addCategory(name.trim());
      onDone();
    } catch {
      setErr("操作失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={category ? "编辑分类" : "新建分类"} onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        <Field label="分类名称" required>
          <input className={inp} value={name} onChange={e => setName(e.target.value)}
            placeholder="如：产品资料、活动话术、培训材料" autoFocus />
        </Field>
        <div className="flex gap-3 pt-1">
          <Btn onClick={submit} disabled={saving}>
            {saving ? "保存中…" : category ? "保存" : "创建"}
          </Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── 文件上传 ────────────────────────────────────────────────────────────
function UploadModal({ categories, defaultCategoryId, onClose, onDone }: {
  categories: SbCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [err, setErr] = useState("");

  const MAX_MB = 50;

  function pickFiles(files: FileList | null) {
    if (!files?.length) return;
    const arr = Array.from(files);
    const oversized = arr.filter(f => f.size > MAX_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setErr(`以下文件超过 ${MAX_MB}MB 限制：${oversized.map(f => f.name).join(", ")}`);
      return;
    }
    setErr("");
    setPending(arr);
  }

  async function upload() {
    if (!categoryId) { setErr("请选择分类"); return; }
    if (pending.length === 0) { setErr("请选择文件"); return; }
    setUploading(true);
    setErr("");
    try {
      for (let i = 0; i < pending.length; i++) {
        setProgress(`上传中 ${i + 1}/${pending.length}…`);
        await uploadFile(pending[i], categoryId, description);
      }
      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "请重试";
      setErr(`上传失败：${msg}`);
    } finally {
      setUploading(false);
      setProgress("");
    }
  }

  return (
    <Modal title="上传文件" onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        <Field label="目标分类" required>
          <select className={inp} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">请选择</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="选择文件" required hint={`单个文件最大 ${MAX_MB}MB，支持图片、PDF、Word、视频等`}>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
            <Plus size={20} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">点击选择文件</p>
            <p className="text-xs text-gray-300 mt-1">支持批量选择</p>
          </div>
          <input ref={fileRef} type="file" multiple className="hidden"
            onChange={e => pickFiles(e.target.files)} />
        </Field>

        {pending.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            {pending.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                <span className="truncate">{f.name}</span>
                <span className="text-gray-400 ml-2 shrink-0">{fmtSize(f.size)}</span>
              </div>
            ))}
          </div>
        )}

        <Field label="文件描述（可选）">
          <input className={inp} value={description} onChange={e => setDescription(e.target.value)}
            placeholder="简短说明文件内容" />
        </Field>

        <div className="flex gap-3 pt-1 items-center">
          <Btn onClick={upload} disabled={uploading}>
            {uploading ? (progress || "上传中…") : `上传${pending.length > 0 ? `（${pending.length}个）` : ""}`}
          </Btn>
          <Btn variant="outline" onClick={onClose} disabled={uploading}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}
