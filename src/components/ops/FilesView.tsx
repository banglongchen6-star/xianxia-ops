"use client";
import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, Upload, X, Loader2,
  Download, ArrowLeft, FolderOpen, Film, Package,
  Image as ImageIcon, Star, ChevronRight, Camera, Archive,
} from "lucide-react";
import { Ctx } from "@/lib/ops/ctx";
import {
  fetchProducts, createProduct, deleteProduct, updateProductCover,
  fetchProductFiles, uploadProductFile, deleteProductFile,
  Product, ProductFile, MaterialType, TabId, MATERIAL_TABS,
} from "@/lib/supabase/products";

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function tabIcon(id: TabId) {
  if (id === "image") return <ImageIcon size={14} />;
  if (id === "selling_point") return <Star size={14} />;
  if (id === "promo") return <Archive size={14} />;
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
  const [tab, setTab] = useState<TabId>("image");
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
          {products.map(p => {
            const active = selId === p.id;
            return (
              <div key={p.id}
                className={`group relative flex items-center transition-colors ${active ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                {/* 封面缩略图（点击换图） */}
                <label className="relative ml-3 shrink-0 cursor-pointer" title="点击更换封面">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {p.cover_url
                      ? <img src={p.cover_url} className="w-full h-full object-cover" />
                      : <Package size={14} className="text-gray-300" />}
                  </div>
                  <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all">
                    <Camera size={11} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await updateProductCover(p.id, file);
                      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, cover_url: url } : x));
                      e.target.value = "";
                    }} />
                </label>
                {/* 产品名 */}
                <button
                  onClick={() => { setSelId(p.id); setTab("image"); }}
                  className={`flex-1 text-left py-2.5 pl-2.5 pr-7 text-sm truncate ${active ? "text-indigo-700 font-medium" : "text-gray-700"}`}>
                  {p.name}
                </button>
                {/* 删除 */}
                <button
                  onClick={() => handleDelete(p.id)}
                  className="absolute right-2.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          {adding ? (
            <div className="space-y-2">
              <input autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="产品名称"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
              />
              <div className="flex gap-2">
                <button onClick={handleAdd}
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-1.5 text-xs hover:bg-indigo-700">确认</button>
                <button onClick={() => setAdding(false)}
                  className="px-3 border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-gray-50">取消</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
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
            <div className="h-14 border-b border-gray-100 bg-white px-6 flex items-center gap-3 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">{sel.name}</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">素材管理</span>
            </div>
            <div className="border-b border-gray-100 bg-white px-6 flex shrink-0 overflow-x-auto">
              {MATERIAL_TABS.map(({ id, label }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    tab === id ? "border-indigo-600 text-indigo-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}>
                  {tabIcon(id)}{label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-50/60">
              {tab === "image" && <ImageTab key={`${sel.id}-img`} productId={sel.id} isCompany />}
              {tab === "selling_point" && <SellingPointTab key={`${sel.id}-sp`} productId={sel.id} isCompany />}
              {tab === "demo_video" && <VideoTab key={`${sel.id}-demo`} productId={sel.id} materialType="demo_video" isCompany />}
              {tab === "promo" && <PromoTab key={`${sel.id}-promo`} productId={sel.id} isCompany />}
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
  const [tab, setTab] = useState<TabId>("image");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(ps => setProducts(ps))
      .catch(console.error)
      .finally(() => setBooting(false));
  }, []);

  if (booting) return <Spinner full />;

  const sel = products.find(p => p.id === selId);

  if (!selId || !sel) {
    return (
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">产品素材库</h2>
        {products.length === 0 ? (
          <Empty icon={<FolderOpen size={40} />} text="暂无产品素材" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <button key={p.id}
                onClick={() => { setSelId(p.id); setTab("image"); }}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden text-left hover:border-indigo-200 hover:shadow-lg transition-all group">
                <div className="h-36 bg-gradient-to-br from-indigo-50 to-gray-100 flex items-center justify-center overflow-hidden">
                  {p.cover_url
                    ? <img src={p.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <Package size={36} className="text-indigo-200" />}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-0.5">
                    查看素材 <ChevronRight size={11} />
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 border-b border-gray-100 bg-white px-6 flex items-center gap-3 shrink-0">
        <button onClick={() => setSelId(null)}
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
              tab === id ? "border-indigo-600 text-indigo-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}>
            {tabIcon(id)}{label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-6 bg-gray-50/60">
        {tab === "image" && <ImageTab key={`${sel.id}-img`} productId={sel.id} isCompany={false} />}
        {tab === "selling_point" && <SellingPointTab key={`${sel.id}-sp`} productId={sel.id} isCompany={false} />}
        {tab === "demo_video" && <VideoTab key={`${sel.id}-demo`} productId={sel.id} materialType="demo_video" isCompany={false} />}
        {tab === "promo" && <PromoTab key={`${sel.id}-promo`} productId={sel.id} isCompany={false} />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 图片素材标签页
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

  if (loading) return <Spinner />;

  return (
    <div>
      {isCompany && (
        <div className="mb-5">
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "上传中…" : "上传图片"}
          </button>
        </div>
      )}
      {files.length === 0 ? <Empty icon={<ImageIcon size={36} />} text="暂无图片" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {files.map(f => (
            <div key={f.id}
              className="group relative aspect-square bg-gray-200 rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setLightbox(f.url!)}>
              <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
              <div className="absolute bottom-0 inset-x-0 p-2 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-all">
                <p className="text-white text-xs truncate drop-shadow max-w-[75%]">{f.name}</p>
                {isCompany && (
                  <button onClick={e => { e.stopPropagation(); deleteProductFile(f.id, f.storage_path).then(() => setFiles(prev => prev.filter(x => x.id !== f.id))); }}
                    className="text-white hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 text-white/60 hover:text-white"><X size={24} /></button>
          <img src={lightbox} className="max-w-full max-h-[88vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 卖点讲解标签页（左：卖点图，右：主播讲解视频）
// ════════════════════════════════════════════════════════════════════════
function SellingPointTab({ productId, isCompany }: { productId: string; isCompany: boolean }) {
  const [images, setImages] = useState<ProductFile[]>([]);
  const [videos, setVideos] = useState<ProductFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVid, setUploadingVid] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [playing, setPlaying] = useState<ProductFile | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetchProductFiles(productId, "selling_image"),
      fetchProductFiles(productId, "selling_video"),
    ])
      .then(([imgs, vids]) => { setImages(imgs); setVideos(vids); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleImgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;
    setUploadingImg(true);
    try {
      for (const file of list) {
        const pf = await uploadProductFile(file, productId, "selling_image");
        setImages(prev => [...prev, pf]);
      }
    } finally { setUploadingImg(false); if (imgRef.current) imgRef.current.value = ""; }
  }

  async function handleVidUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVid(true);
    try {
      const pf = await uploadProductFile(file, productId, "selling_video");
      setVideos(prev => [...prev, pf]);
    } finally { setUploadingVid(false); if (vidRef.current) vidRef.current.value = ""; }
  }

  if (loading) return <Spinner />;

  return (
    <div className="flex gap-6">
      {/* ── 左：卖点图片 ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">卖点图片</h3>
          {isCompany && (
            <>
              <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImgUpload} />
              <button onClick={() => imgRef.current?.click()} disabled={uploadingImg}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-60 transition-all">
                {uploadingImg ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {uploadingImg ? "上传中…" : "上传图片"}
              </button>
            </>
          )}
        </div>
        {images.length === 0 ? (
          <Empty icon={<ImageIcon size={28} />} text="暂无卖点图片" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {images.map(f => (
              <div key={f.id}
                className="group relative aspect-video bg-gray-200 rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setLightbox(f.url!)}>
                <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                {isCompany && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteProductFile(f.id, f.storage_path).then(() => setImages(prev => prev.filter(x => x.id !== f.id))); }}
                    className="absolute top-2 right-2 text-white opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分隔线 */}
      <div className="w-px bg-gray-200 self-stretch shrink-0" />

      {/* ── 右：主播讲解视频 ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">主播讲解视频</h3>
          {isCompany && (
            <>
              <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={handleVidUpload} />
              <button onClick={() => vidRef.current?.click()} disabled={uploadingVid}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-60 transition-all">
                {uploadingVid ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {uploadingVid ? "上传中，请稍候…" : "上传视频"}
              </button>
            </>
          )}
        </div>
        {videos.length === 0 ? (
          <Empty icon={<Film size={28} />} text="暂无讲解视频" />
        ) : (
          <div className="space-y-3">
            {videos.map(f => (
              <div key={f.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Film size={18} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtSize(f.size)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setPlaying(f)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs hover:bg-indigo-100 transition-colors">
                    ▶ 播放
                  </button>
                  <a href={f.url} download={f.name}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-gray-50">
                    <Download size={12} />下载
                  </a>
                  {isCompany && (
                    <button onClick={() => deleteProductFile(f.id, f.storage_path).then(() => setVideos(prev => prev.filter(x => x.id !== f.id)))}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 灯箱 */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 text-white/60 hover:text-white"><X size={24} /></button>
          <img src={lightbox} className="max-w-full max-h-[88vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* 视频播放弹窗 */}
      {playing && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPlaying(null)}>
          <button className="absolute top-5 right-5 text-white/60 hover:text-white"><X size={24} /></button>
          <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <p className="text-white/60 text-sm mb-3 truncate">{playing.name}</p>
            <video src={playing.url} controls autoPlay className="w-full rounded-xl bg-black" style={{ maxHeight: "72vh" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 产品功能讲解标签页（多个分节小视频，在线播放）
// ════════════════════════════════════════════════════════════════════════
function VideoTab({ productId, materialType, isCompany }: {
  productId: string; materialType: MaterialType; isCompany: boolean;
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
    } finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      {isCompany && (
        <div className="mb-5">
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "上传中，大文件请稍候…" : "上传视频"}
          </button>
        </div>
      )}
      {files.length === 0 ? <Empty icon={<Film size={36} />} text="暂无视频" /> : (
        <div className="space-y-3">
          {files.map((f, i) => (
            <div key={f.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-indigo-500 text-sm font-bold">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtSize(f.size)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setPlaying(f)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
                  ▶ 播放
                </button>
                <a href={f.url} download={f.name}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-gray-50">
                  <Download size={12} />下载
                </a>
                {isCompany && (
                  <button onClick={() => deleteProductFile(f.id, f.storage_path).then(() => setFiles(prev => prev.filter(x => x.id !== f.id)))}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {playing && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPlaying(null)}>
          <button className="absolute top-5 right-5 text-white/60 hover:text-white"><X size={24} /></button>
          <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <p className="text-white/60 text-sm mb-3 truncate">{playing.name}</p>
            <video src={playing.url} controls autoPlay className="w-full rounded-xl bg-black" style={{ maxHeight: "72vh" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 宣发素材标签页（压缩包，只下载不播放）
// ════════════════════════════════════════════════════════════════════════
function PromoTab({ productId, isCompany }: { productId: string; isCompany: boolean }) {
  const [files, setFiles] = useState<ProductFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProductFiles(productId, "promo")
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
        const pf = await uploadProductFile(file, productId, "promo");
        setFiles(prev => [...prev, pf]);
      }
    } finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      {isCompany && (
        <div className="mb-5">
          <input ref={inputRef} type="file"
            accept=".zip,.rar,.7z,.tar,.tar.gz,.tar.bz2"
            multiple className="hidden" onChange={handleUpload} />
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "上传中…" : "上传压缩包"}
          </button>
          <p className="text-xs text-gray-400 mt-2">支持 .zip .rar .7z 等压缩格式</p>
        </div>
      )}
      {files.length === 0 ? <Empty icon={<Archive size={36} />} text="暂无宣发素材" /> : (
        <div className="space-y-3">
          {files.map(f => (
            <div key={f.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <Archive size={18} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtSize(f.size)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={f.url} download={f.name}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 transition-colors">
                  <Download size={12} />下载
                </a>
                {isCompany && (
                  <button onClick={() => deleteProductFile(f.id, f.storage_path).then(() => setFiles(prev => prev.filter(x => x.id !== f.id)))}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
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
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <div className="text-gray-200 mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
