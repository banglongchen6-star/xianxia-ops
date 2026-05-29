"use client";
import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, Upload, X, Edit2, Loader2,
  Download, ArrowLeft, FolderOpen, Film, Package,
  Image as ImageIcon, Star, Check, ChevronRight,
} from "lucide-react";
import { Ctx } from "@/lib/ops/ctx";
import {
  fetchProducts, createProduct, deleteProduct,
  fetchProductFiles, uploadProductFile, saveSellingPoint, deleteProductFile,
  Product, ProductFile, MaterialType, MATERIAL_TABS,
} from "@/lib/supabase/products";

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function tabIcon(id: MaterialType) {
  if (id === "image") return <ImageIcon size={14} />;
  if (id === "selling_point") return <Star size={14} />;
  return <Film size={14} />;
}

export default function FilesView({ ctx }: { ctx: Ctx }) {
  return ctx.session.role === "company" ? <CompanyFilesView /> : <PartnerFilesView />;
}

// ════════════════════════════════════════════════════════════════════════
// 公司端
// ════════════════════════════════════════════════════════════════════════
function CompanyFilesView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [tab, setTab] = useState<MaterialType>("image");
  const [booting, setBooting] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(ps => {
        setProducts(ps);
        if (ps.length > 0) setSelId(ps[0].id);
      })
      .catch(console.error)
      .finally(() => setBooting(false));
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    const p = await createProduct(newName.trim());
    setProducts(prev => [...prev, p]);
    setSelId(p.id);
    setTab("image");
    setNewName(""); setAdding(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("删除产品将同时删除所有素材，确认？")) return;
    await deleteProduct(id);
    const rest = products.filter(p => p.id !== id);
    setProducts(rest);
    setSelId(rest[0]?.id ?? null);
  }

  const sel = products.find(p => p.id === selId);

  if (booting) return <Spinner full />;

  return (
    <div className="flex min-h-full">
      {/* ── 左侧产品列表 ── */}
      <aside className="w-52 border-r border-gray-100 bg-white flex flex-col shrink-0">
        <div className="px-4 py-3.5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">产品列表</p>
        </div>
        <nav className="flex-1 py-2">
          {products.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">暂无产品</p>
          )}
          {products.map(p => (
            <div key={p.id} className="group relative">
              <button
                onClick={() => { setSelId(p.id); setTab("image"); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors pr-8 truncate ${
                  selId === p.id
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}>
                {p.name}
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          {adding ? (
            <div className="space-y-2">
              <input
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="产品名称"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") setAdding(false);
                }}
              />
              <div className="flex gap-2">
                <button onClick={handleAdd}
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-1.5 text-xs hover:bg-indigo-700">
                  确认
                </button>
                <button onClick={() => setAdding(false)}
                  className="px-3 border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-gray-50">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <Plus size={14} />新增产品
            </button>
          )}
        </div>
      </aside>

      {/* ── 右侧内容 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!sel ? (
          <div className="flex-1 flex items-center justify-center py-20 text-gray-400 text-sm">
            <div className="text-center">
              <Package size={40} className="mx-auto mb-3 text-gray-200" />
              <p>请选择或新增产品</p>
            </div>
          </div>
        ) : (
          <>
            {/* 产品标题栏 */}
            <div className="h-14 border-b border-gray-100 bg-white px-6 flex items-center gap-3 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">{sel.name}</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">素材管理</span>
            </div>

            {/* 素材类型 Tabs */}
            <div className="border-b border-gray-100 bg-white px-6 flex shrink-0 overflow-x-auto">
              {MATERIAL_TABS.map(({ id, label }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    tab === id
                      ? "border-indigo-600 text-indigo-600 font-medium"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}>
                  {tabIcon(id)}{label}
                </button>
              ))}
            </div>

            {/* Tab 内容 */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50/60">
              {tab === "image" && (
                <ImageTab key={`${sel.id}-img`} productId={sel.id} isCompany />
              )}
              {tab === "selling_point" && (
                <SellingPointTab key={`${sel.id}-sp`} productId={sel.id} isCompany />
              )}
              {(tab === "demo_video" || tab === "kol_video" || tab === "brand_video") && (
                <VideoTab key={`${sel.id}-${tab}`} productId={sel.id} materialType={tab} isCompany />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 客户端
// ════════════════════════════════════════════════════════════════════════
function PartnerFilesView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [tab, setTab] = useState<MaterialType>("image");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(ps => setProducts(ps))
      .catch(console.error)
      .finally(() => setBooting(false));
  }, []);

  if (booting) return <Spinner full />;

  const sel = products.find(p => p.id === selId);

  // 产品选择页
  if (!selId || !sel) {
    return (
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">产品素材库</h2>
        {products.length === 0 ? (
          <Empty icon={<FolderOpen size={40} />} text="暂无产品素材" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelId(p.id); setTab("image"); }}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                  <Package size={20} className="text-indigo-500" />
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-0.5">
                  查看素材 <ChevronRight size={11} />
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 产品素材页
  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 border-b border-gray-100 bg-white px-6 flex items-center gap-3 shrink-0">
        <button
          onClick={() => setSelId(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={15} />返回
        </button>
        <span className="text-gray-200">|</span>
        <h2 className="text-sm font-semibold text-gray-900">{sel.name}</h2>
      </div>

      <div className="border-b border-gray-100 bg-white px-6 flex shrink-0 overflow-x-auto">
        {MATERIAL_TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === id
                ? "border-indigo-600 text-indigo-600 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}>
            {tabIcon(id)}{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50/60">
        {tab === "image" && (
          <ImageTab key={`${sel.id}-img`} productId={sel.id} isCompany={false} />
        )}
        {tab === "selling_point" && (
          <SellingPointTab key={`${sel.id}-sp`} productId={sel.id} isCompany={false} />
        )}
        {(tab === "demo_video" || tab === "kol_video" || tab === "brand_video") && (
          <VideoTab key={`${sel.id}-${tab}`} productId={sel.id} materialType={tab} isCompany={false} />
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 图片标签页
// ════════════════════════════════════════════════════════════════════════
function ImageTab({ productId, isCompany }: { productId: string; isCompany: boolean }) {
  const [files, setFiles] = useState<ProductFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProductFiles(productId, "image")
      .then(fs => setFiles(fs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        const pf = await uploadProductFile(file, productId, "image");
        setFiles(prev => [...prev, pf]);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(f: ProductFile) {
    await deleteProductFile(f.id, f.storage_path);
    setFiles(prev => prev.filter(x => x.id !== f.id));
  }

  if (loading) return <Spinner />;

  return (
    <div>
      {isCompany && (
        <div className="mb-5">
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "上传中…" : "上传图片"}
          </button>
        </div>
      )}

      {files.length === 0
        ? <Empty icon={<ImageIcon size={36} />} text="暂无图片" />
        : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {files.map(f => (
              <div
                key={f.id}
                className="group relative aspect-square bg-gray-200 rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setLightbox(f.url!)}>
                <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                <div className="absolute bottom-0 inset-x-0 p-2 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-all">
                  <p className="text-white text-xs truncate drop-shadow max-w-[75%]">{f.name}</p>
                  {isCompany && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(f); }}
                      className="text-white hover:text-red-400 transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* 灯箱 */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <img
            src={lightbox}
            className="max-w-full max-h-[88vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 卖点讲解标签页
// ════════════════════════════════════════════════════════════════════════
interface SpForm {
  name: string;
  content: string;
  imageFile: File | null;
  imageCleared: boolean;
}

function SellingPointTab({ productId, isCompany }: { productId: string; isCompany: boolean }) {
  const [items, setItems] = useState<ProductFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ProductFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SpForm>({ name: "", content: "", imageFile: null, imageCleared: false });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProductFiles(productId, "selling_point")
      .then(fs => setItems(fs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  function openAdd() {
    setEditItem(null);
    setForm({ name: "", content: "", imageFile: null, imageCleared: false });
    setPreviewUrl(null);
    setShowForm(true);
  }

  function openEdit(item: ProductFile) {
    setEditItem(item);
    setForm({ name: item.name, content: item.content, imageFile: null, imageCleared: false });
    setPreviewUrl(item.url ?? null);
    setShowForm(true);
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, imageFile: file, imageCleared: false }));
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearImg() {
    setPreviewUrl(null);
    setForm(f => ({ ...f, imageFile: null, imageCleared: true }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const result = await saveSellingPoint({
        productId,
        name: form.name.trim(),
        content: form.content,
        imageFile: form.imageFile,
        existingId: editItem?.id,
        existingPath: editItem?.storage_path,
        clearImage: form.imageCleared,
      });
      setItems(prev =>
        editItem
          ? prev.map(x => x.id === editItem.id ? result : x)
          : [...prev, result]
      );
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      {isCompany && !showForm && (
        <div className="mb-5">
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-all">
            <Plus size={14} />新增卖点
          </button>
        </div>
      )}

      {/* 编辑表单 */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-5">
            {editItem ? "编辑卖点" : "新增卖点"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">标题 *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="卖点标题，例：音色还原度高达 98%"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">详细说明</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                rows={4}
                placeholder="详细描述该卖点的优势和使用场景…"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">配图（可选）</label>
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              {previewUrl ? (
                <div className="relative inline-block">
                  <img src={previewUrl} className="h-36 rounded-xl object-cover border border-gray-100" />
                  <button
                    onClick={clearImg}
                    className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 shadow text-gray-400 hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => imgRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                  <ImageIcon size={14} />上传配图
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? "保存中…" : "保存"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              取消
            </button>
          </div>
        </div>
      )}

      {/* 卖点列表 */}
      {items.length === 0 && !showForm
        ? <Empty icon={<Star size={36} />} text="暂无卖点内容" />
        : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 hover:border-gray-200 transition-colors">
                {item.url && (
                  <img
                    src={item.url}
                    className="w-32 h-28 rounded-xl object-cover shrink-0 border border-gray-100"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</h4>
                    {isCompany && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => openEdit(item)}
                          className="text-gray-300 hover:text-indigo-500 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteProductFile(item.id, item.storage_path)
                            .then(() => setItems(prev => prev.filter(x => x.id !== item.id)))}
                          className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {item.content && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 视频标签页（视频展示 / 达人宣发 / 品宣视频）
// ════════════════════════════════════════════════════════════════════════
function VideoTab({
  productId, materialType, isCompany,
}: {
  productId: string;
  materialType: MaterialType;
  isCompany: boolean;
}) {
  const [files, setFiles] = useState<ProductFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState<ProductFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProductFiles(productId, materialType)
      .then(fs => setFiles(fs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId, materialType]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const pf = await uploadProductFile(file, productId, materialType);
      setFiles(prev => [...prev, pf]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      {isCompany && (
        <div className="mb-5">
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "上传中，大文件请稍候…" : "上传视频"}
          </button>
        </div>
      )}

      {files.length === 0
        ? <Empty icon={<Film size={36} />} text="暂无视频" />
        : (
          <div className="space-y-3">
            {files.map(f => (
              <div key={f.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-200 transition-colors">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Film size={18} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtSize(f.size)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPlaying(f)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
                    ▶ 播放
                  </button>
                  <a
                    href={f.url}
                    download={f.name}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                    <Download size={12} />下载
                  </a>
                  {isCompany && (
                    <button
                      onClick={() => deleteProductFile(f.id, f.storage_path)
                        .then(() => setFiles(prev => prev.filter(x => x.id !== f.id)))}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* 视频播放弹窗 */}
      {playing && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPlaying(null)}>
          <button className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <p className="text-white/60 text-sm mb-3 truncate">{playing.name}</p>
            <video
              src={playing.url}
              controls
              autoPlay
              className="w-full rounded-xl bg-black"
              style={{ maxHeight: "72vh" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── 通用小组件 ────────────────────────────────────────────────────────────
function Spinner({ full }: { full?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${full ? "h-64" : "py-10"}`}>
      <Loader2 className="animate-spin text-gray-300" size={24} />
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="text-gray-200 mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
