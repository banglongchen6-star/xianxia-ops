"use client";
import { useMemo, useState, useRef } from "react";
import { Ctx } from "@/lib/ops/ctx";
import { projectStore, partnerStore, messageStore, compressImage } from "@/lib/ops/store";
import { Project, ProjectStatus, MediaItem, PROJECT_STATUSES } from "@/lib/ops/types";
import { inp, Field, Btn, Modal, RegionSelect, StatusBadge, EmptyState } from "./ui";
import { Breadcrumb } from "./ProfileViews";
import { Plus, MapPin, Calendar, Clock, Video, Image as ImageIcon, Trash2, Upload, ShoppingCart, ListChecks, FileText, Wallet } from "lucide-react";
import OrdersTab from "./OrdersTab";
import SettlementTab from "./SettlementTab";
import MaterialsTab from "./MaterialsTab";
import ContractTab from "./ContractTab";

type DetailTab = "info" | "orders" | "materials" | "contract" | "settlement";

// ════════════════════════════════════════════════════════════════════════
// 项目列表
// ════════════════════════════════════════════════════════════════════════
export function ProjectsView({ ctx }: { ctx: Ctx }) {
  const isCompany = ctx.session.role === "company";
  const [filter, setFilter] = useState<ProjectStatus | "全部">("全部");
  const [formOpen, setFormOpen] = useState(false);

  const projects = useMemo(() => {
    const all = projectStore.list();
    const scoped = isCompany ? all : all.filter(p => p.partnerId === ctx.session.partnerId);
    const filtered = filter === "全部" ? scoped : scoped.filter(p => p.status === filter);
    return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [isCompany, ctx.session.partnerId, filter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{isCompany ? "项目中心" : "我的项目"}</h2>
        <Btn onClick={() => setFormOpen(true)}><span className="flex items-center gap-1.5"><Plus size={14} />新建项目</span></Btn>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["全部", ...PROJECT_STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filter === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">活动名称</th>
              {isCompany && <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">琴行</th>}
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">地点</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">活动日期</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {projects.length === 0 && (
              <tr><td colSpan={isCompany ? 5 : 4} className="px-4 py-10 text-center text-gray-400 text-sm">暂无项目</td></tr>
            )}
            {projects.map(p => {
              const partner = partnerStore.get(p.partnerId);
              return (
                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => ctx.go("project-detail", p.id)}>
                  <td className="px-4 py-3 text-indigo-600 font-medium">{p.title}</td>
                  {isCompany && <td className="px-4 py-3 text-gray-600">{partner?.storeName ?? "—"}</td>}
                  <td className="px-4 py-3 text-gray-500">{p.city}{p.district}</td>
                  <td className="px-4 py-3 text-gray-500">{p.eventDate || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <ProjectFormModal ctx={ctx} onClose={() => setFormOpen(false)}
          onDone={(id) => { setFormOpen(false); ctx.go("project-detail", id); }} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 项目详情 + 状态操作
// ════════════════════════════════════════════════════════════════════════
export function ProjectDetailView({ ctx }: { ctx: Ctx }) {
  const isCompany = ctx.session.role === "company";
  const [tick, setTick] = useState(0);
  const p = useMemo(() => projectStore.get(ctx.selectedId), [ctx.selectedId, tick]);
  const [editOpen, setEditOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("info");

  if (!p) return <EmptyState text="未找到该项目" />;
  const partner = partnerStore.get(p.partnerId);
  const reload = () => { setTick(t => t + 1); ctx.refresh(); };

  // ── 状态操作 ──
  function launch() {
    projectStore.update(p!.id, { status: "执行中" });
    messageStore.send("company", "新活动已发起", `${partner?.storeName} 发起了「${p!.title}」`, p!.id);
    reload();
  }
  function settle() {
    projectStore.update(p!.id, { status: "已结算" });
    messageStore.send(p!.partnerId, "活动已结算", `「${p!.title}」已完成结算`, p!.id);
    reload();
  }

  const canPartnerEdit = !isCompany && !["已结算", "已取消"].includes(p.status);

  // 哪些 tab 可见
  const active = ["执行中", "待结算", "已结算"].includes(p.status);
  const showOrders    = isCompany && active;
  const showContract  = isCompany && active;
  const showMaterials = active;
  const showSettlement = isCompany && active;

  const tabs: { id: DetailTab; label: string; icon: any }[] = [
    { id: "info", label: "基本信息", icon: MapPin },
    ...(showOrders ? [{ id: "orders" as DetailTab, label: "订单", icon: ShoppingCart }] : []),
    ...(showMaterials ? [{ id: "materials" as DetailTab, label: "物料清单", icon: ListChecks }] : []),
    ...(showContract ? [{ id: "contract" as DetailTab, label: "合同", icon: FileText }] : []),
    ...(showSettlement ? [{ id: "settlement" as DetailTab, label: "结算", icon: Wallet }] : []),
  ];

  return (
    <div className="p-6">
      <Breadcrumb back={isCompany ? "项目中心" : "我的项目"} current={p.title} onBack={() => ctx.go("projects")} />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Tab 导航 */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === id ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {/* Tab 内容 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {activeTab === "info" && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{p.title}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">{partner?.storeName}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Info icon={MapPin} label="地点" value={`${p.province}${p.city}${p.district} ${p.venue}`} />
                  <Info icon={Calendar} label="活动日期" value={p.eventDate || "待定"} />
                  <Info icon={Clock} label="计划时段" value={p.planStart && p.planEnd ? `${p.planStart} – ${p.planEnd}${(() => { const [sh, sm] = p.planStart.split(":").map(Number); const [eh, em] = p.planEnd.split(":").map(Number); const mins = (eh * 60 + em) - (sh * 60 + sm); if (mins <= 0) return ""; const h = Math.floor(mins / 60), m = mins % 60; return `（${h > 0 ? h + "小时" : ""}${m > 0 ? m + "分钟" : ""}）`; })()}` : "待定"} />
                  <Info icon={Video} label="抖音账号" value={p.douyinAccount} />
                </div>

                {/* 结算资料（待结算/已结算时展示） */}
                {(p.status === "待结算" || p.status === "已结算") && (
                  <div className="mt-5 pt-4 border-t border-gray-50">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">提交的结算资料</h3>
                    <div className="text-sm text-gray-600 mb-3">
                      实际直播时段：<span className="text-gray-800 font-medium">{p.liveStart} – {p.liveEnd}</span>
                    </div>
                    <MediaGallery title={`直播切片 (${p.liveClips.length})`} items={p.liveClips} />
                    <MediaGallery title={`现场照片 (${p.scenePhotos.length})`} items={p.scenePhotos} />
                  </div>
                )}

                {/* 客户端操作按钮 */}
                {!isCompany && (
                  <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2 items-center">
                    {canPartnerEdit && <Btn variant="outline" onClick={() => setEditOpen(true)}>编辑活动</Btn>}
                    {p.status === "执行中" && <Btn onClick={() => setSettleOpen(true)}>提交结算资料</Btn>}
                    {canPartnerEdit && (
                      <button
                        onClick={() => { if (confirm("确认删除该项目？")) { projectStore.delete(p.id); ctx.refresh(); ctx.go("projects"); } }}
                        className="text-xs text-red-400 hover:text-red-600 ml-auto">
                        删除项目
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "orders" && (
              <OrdersTab project={p} isCompany={isCompany} />
            )}

            {activeTab === "materials" && (
              <MaterialsTab project={p} isCompany={isCompany} />
            )}

            {activeTab === "contract" && (
              <ContractTab project={p} isCompany={isCompany} />
            )}

            {activeTab === "settlement" && (
              <SettlementTab project={p} isCompany={isCompany} onSettle={settle} />
            )}
          </div>
        </div>

        {/* 操作侧栏 - 仅公司 */}
        {isCompany && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">操作</h3>
              <div className="space-y-2">
                {p.status === "待结算" && (
                  <Btn className="w-full" onClick={settle}>确认结算</Btn>
                )}
                {p.status !== "待结算" && (
                  <p className="text-xs text-gray-400 text-center py-2">当前状态无可执行操作</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {editOpen && (
        <ProjectFormModal ctx={ctx} project={p} onClose={() => setEditOpen(false)} onDone={() => { setEditOpen(false); reload(); }} />
      )}
      {settleOpen && (
        <SettlementModal project={p} onClose={() => setSettleOpen(false)} onDone={() => {
          messageStore.send("company", "活动待结算", `${partner?.storeName} 提交了「${p.title}」的结算资料`, p.id);
          setSettleOpen(false); reload();
        }} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 新建/编辑项目
// ════════════════════════════════════════════════════════════════════════
function ProjectFormModal({ ctx, project, onClose, onDone }: {
  ctx: Ctx; project?: Project; onClose: () => void; onDone: (id: string) => void;
}) {
  const isCompany = ctx.session.role === "company";
  const partners = useMemo(() => partnerStore.list(), []);
  const [form, setForm] = useState({
    partnerId: project?.partnerId ?? (isCompany ? "" : ctx.session.partnerId ?? ""),
    title: project?.title ?? "",
    province: project?.province ?? "", city: project?.city ?? "", district: project?.district ?? "",
    venue: project?.venue ?? "", eventDate: project?.eventDate ?? "",
    planStart: project?.planStart ?? "", planEnd: project?.planEnd ?? "",
    douyinAccount: project?.douyinAccount ?? "",
  });
  const [err, setErr] = useState("");
  function s(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.title || !form.partnerId || !form.venue) {
      setErr("活动名称、琴行、具体地点为必填"); return;
    }
    const allFilled = !!(form.title && form.partnerId && form.province && form.city && form.venue && form.eventDate && form.planStart && form.planEnd && form.douyinAccount);
    const autoStatus = allFilled ? "执行中" : "草稿";
    if (project) {
      const keepStatus = ["待结算", "已结算", "已取消"].includes(project.status);
      projectStore.update(project.id, { ...form, eventDate: form.eventDate || null, planStart: form.planStart || null, planEnd: form.planEnd || null, ...(keepStatus ? {} : { status: autoStatus }) });
      onDone(project.id);
    } else {
      const rec = projectStore.create({ ...form, status: autoStatus });
      onDone(rec.id);
    }
  }

  return (
    <Modal title={project ? "编辑活动" : "新建活动"} onClose={onClose} wide>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        {isCompany && (
          <Field label="所属琴行" required>
            <select className={inp} value={form.partnerId} onChange={e => s("partnerId", e.target.value)}>
              <option value="">请选择琴行</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.storeName}（{p.contactName}）</option>)}
            </select>
          </Field>
        )}
        <Field label="活动名称" required>
          <input className={inp} value={form.title} onChange={e => s("title", e.target.value)} placeholder="例：XX广场周末钢琴路演" />
        </Field>
        <Field label="活动地区" required>
          <RegionSelect province={form.province} city={form.city} district={form.district}
            onChange={(v) => setForm(f => ({ ...f, ...v }))} />
        </Field>
        <Field label="具体地点" required hint="选在人流量大的热闹位置">
          <input className={inp} value={form.venue} onChange={e => s("venue", e.target.value)} placeholder="例：万达广场一楼中庭" />
        </Field>
        <div className="grid grid-cols-4 gap-3">
          <Field label="活动日期" required><input type="date" className={inp} value={form.eventDate} onChange={e => s("eventDate", e.target.value)} /></Field>
          <Field label="计划开始" required><input type="time" className={inp} value={form.planStart} onChange={e => s("planStart", e.target.value)} /></Field>
          <Field label="计划结束" required><input type="time" className={inp} value={form.planEnd} onChange={e => s("planEnd", e.target.value)} /></Field>
          <Field label="时长">
            <div className={`${inp} bg-gray-50 text-gray-500 cursor-default`}>
              {(() => {
                if (!form.planStart || !form.planEnd) return "自动计算";
                const [sh, sm] = form.planStart.split(":").map(Number);
                const [eh, em] = form.planEnd.split(":").map(Number);
                const mins = (eh * 60 + em) - (sh * 60 + sm);
                if (mins <= 0) return "时间有误";
                const h = Math.floor(mins / 60), m = mins % 60;
                return `${h > 0 ? h + "小时" : ""}${m > 0 ? m + "分钟" : ""}`;
              })()}
            </div>
          </Field>
        </div>
        <Field label="抖音账号" required hint="公司将通过该账号监看直播">
          <input className={inp} value={form.douyinAccount} onChange={e => s("douyinAccount", e.target.value)} placeholder="抖音号 / 主页链接" />
        </Field>
        <div className="flex gap-3 pt-1">
          <Btn onClick={submit}>{project ? "保存" : "创建（存为草稿）"}</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════
// 提交结算资料（实际时段 + 切片 + ≥5 现场照片）
// ════════════════════════════════════════════════════════════════════════
function SettlementModal({ project, onClose, onDone }: {
  project: Project; onClose: () => void; onDone: () => void;
}) {
  const [liveStart, setLiveStart] = useState(project.liveStart ?? "");
  const [liveEnd, setLiveEnd] = useState(project.liveEnd ?? "");
  const [clips, setClips] = useState<MediaItem[]>(project.liveClips);
  const [photos, setPhotos] = useState<MediaItem[]>(project.scenePhotos);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const clipRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null, setter: (fn: (prev: MediaItem[]) => MediaItem[]) => void) {
    if (!files?.length) return;
    setUploading(true);
    const items = await Promise.all(Array.from(files).map(f => compressImage(f)));
    setter(prev => [...prev, ...items]);
    setUploading(false);
  }

  function submit() {
    if (!liveStart || !liveEnd) { setErr("请填写实际直播时段"); return; }
    if (clips.length === 0) { setErr("请至少上传 1 个直播切片/截图"); return; }
    if (photos.length < 5) { setErr(`现场照片至少 5 张，当前 ${photos.length} 张`); return; }
    projectStore.update(project.id, {
      status: "待结算", liveStart, liveEnd, liveClips: clips, scenePhotos: photos,
    });
    onDone();
  }

  return (
    <Modal title="提交结算资料" onClose={onClose} wide>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-4">
        <Field label="实际直播时段" required>
          <div className="flex items-center gap-2">
            <input type="time" className={inp} value={liveStart} onChange={e => setLiveStart(e.target.value)} />
            <span className="text-gray-400">至</span>
            <input type="time" className={inp} value={liveEnd} onChange={e => setLiveEnd(e.target.value)} />
          </div>
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">直播切片/截图 <span className="text-red-400">*</span></label>
            <button onClick={() => clipRef.current?.click()} className="text-xs text-indigo-600 flex items-center gap-1"><Upload size={12} />上传</button>
            <input ref={clipRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files, setClips)} />
          </div>
          <MediaEditGallery items={clips} onRemove={(id) => setClips(c => c.filter(x => x.id !== id))} icon={Video} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              现场照片 <span className="text-red-400">*</span>
              <span className={`ml-2 text-xs ${photos.length >= 5 ? "text-green-500" : "text-amber-500"}`}>
                {photos.length}/5 {photos.length >= 5 ? "✓" : "（至少5张）"}
              </span>
            </label>
            <button onClick={() => photoRef.current?.click()} className="text-xs text-indigo-600 flex items-center gap-1"><Upload size={12} />上传</button>
            <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files, setPhotos)} />
          </div>
          <MediaEditGallery items={photos} onRemove={(id) => setPhotos(c => c.filter(x => x.id !== id))} icon={ImageIcon} />
        </div>

        {uploading && <p className="text-xs text-gray-400">图片处理中…</p>}
        <div className="flex gap-3 pt-1">
          <Btn onClick={submit} disabled={uploading}>提交（转待结算）</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── 小组件 ──────────────────────────────────────────────────────────────
function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-gray-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function MediaGallery({ title, items }: { title: string; items: MediaItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-xs text-gray-400 mb-1.5">{title}</p>
      <div className="grid grid-cols-5 gap-2">
        {items.map(m => (
          <a key={m.id} href={m.dataUrl} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-gray-100">
            <img src={m.dataUrl} alt={m.name} className="w-full h-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}

function MediaEditGallery({ items, onRemove, icon: Icon }: { items: MediaItem[]; onRemove: (id: string) => void; icon: any }) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center text-gray-300">
        <Icon size={20} /><span className="text-xs mt-1">还没有上传</span>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-5 gap-2">
      {items.map(m => (
        <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 group">
          <img src={m.dataUrl} alt={m.name} className="w-full h-full object-cover" />
          <button onClick={() => onRemove(m.id)}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
