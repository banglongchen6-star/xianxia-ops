"use client";
import { useState, useMemo } from "react";
import { Ctx } from "@/lib/ops/ctx";
import { materialLibStore, materialUnitStore, partnerStore } from "@/lib/ops/store";
import { MaterialLibItem, MaterialUnit, UnitStatus } from "@/lib/ops/types";
import { inp, Field, Btn, Modal, EmptyState } from "./ui";
import { Plus, Pencil, Trash2, Tag, ChevronDown, ChevronRight, Package2 } from "lucide-react";

const UNIT_COLOR: Record<UnitStatus, string> = {
  在库: "bg-green-100 text-green-700",
  已发出: "bg-amber-100 text-amber-700",
  已归还: "bg-gray-100 text-gray-500",
};

export default function SamplesView({ ctx }: { ctx: Ctx }) {
  return ctx.session.role === "company"
    ? <CompanySamplesView />
    : <PartnerSamplesView partnerId={ctx.session.partnerId!} />;
}

// ════════════════════════════════════════════════════════════════════════
// 公司端
// ════════════════════════════════════════════════════════════════════════
function CompanySamplesView() {
  const [items, setItems] = useState(() => materialLibStore.list());
  const [units, setUnits] = useState(() => materialUnitStore.list());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [libForm, setLibForm] = useState<{ open: boolean; item: MaterialLibItem | null }>({ open: false, item: null });
  const [unitForm, setUnitForm] = useState<{ open: boolean; libItemId: string; unit: MaterialUnit | null } | null>(null);

  const reload = () => { setItems(materialLibStore.list()); setUnits(materialUnitStore.list()); };

  const grouped = useMemo(() => {
    const map: Record<string, MaterialLibItem[]> = {};
    items.forEach(i => { (map[i.category] ??= []).push(i); });
    return map;
  }, [items]);

  const partners = useMemo(() => partnerStore.list(), []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">物料库</h2>
          <p className="text-xs text-gray-400 mt-0.5">统一管理活动所需物料；开启追踪的条目可管理序列号与借出状态</p>
        </div>
        <Btn onClick={() => setLibForm({ open: true, item: null })}>
          <span className="flex items-center gap-1.5"><Plus size={14} />添加物料</span>
        </Btn>
      </div>

      {items.length === 0 && <EmptyState text="暂无物料，点击右上角添加" />}

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, catItems]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{category}</h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {catItems.map((item, idx) => {
                const itemUnits = units.filter(u => u.libItemId === item.id);
                const isExpanded = expandedId === item.id;
                return (
                  <div key={item.id} className={idx < catItems.length - 1 || isExpanded ? "border-b border-gray-100" : ""}>
                    {/* Row */}
                    <div className={`flex items-center gap-3 px-4 py-3 ${isExpanded ? "bg-indigo-50/30" : "hover:bg-gray-50"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-800">{item.name}</span>
                          {item.trackable && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                              <Tag size={10} />可追踪
                            </span>
                          )}
                        </div>
                        {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.trackable && (
                          <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors">
                            {itemUnits.length} 件
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>
                        )}
                        <button onClick={() => setLibForm({ open: true, item })}
                          className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => { if (confirm(`删除「${item.name}」？`)) { materialLibStore.delete(item.id); reload(); } }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* 单体追踪展开面板 */}
                    {isExpanded && item.trackable && (
                      <div className="bg-amber-50/40 px-4 py-3 border-t border-amber-100">
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="text-xs font-semibold text-amber-700">序列号追踪</p>
                          <button onClick={() => setUnitForm({ open: true, libItemId: item.id, unit: null })}
                            className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 px-2 py-1 hover:bg-amber-100 rounded-lg transition-colors">
                            <Plus size={11} />添加单体
                          </button>
                        </div>
                        {itemUnits.length === 0 ? (
                          <p className="text-xs text-gray-400 py-1">暂无序列号记录</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400">
                                <th className="text-left pb-2 font-medium">序列号</th>
                                <th className="text-left pb-2 font-medium">状态</th>
                                <th className="text-left pb-2 font-medium">持有琴行</th>
                                <th className="text-left pb-2 font-medium">预计归还</th>
                                <th className="pb-2" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100/60">
                              {itemUnits.map(u => {
                                const partner = partners.find(p => p.id === u.currentPartnerId);
                                return (
                                  <tr key={u.id} className="hover:bg-amber-50/60">
                                    <td className="py-2 font-mono text-gray-700">{u.serial}</td>
                                    <td className="py-2">
                                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${UNIT_COLOR[u.status]}`}>{u.status}</span>
                                    </td>
                                    <td className="py-2 text-gray-600">{partner?.storeName ?? "—"}</td>
                                    <td className="py-2 text-gray-500">{u.expectedReturnDate ?? "—"}</td>
                                    <td className="py-2">
                                      <div className="flex gap-1 justify-end">
                                        <button onClick={() => setUnitForm({ open: true, libItemId: item.id, unit: u })}
                                          className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"><Pencil size={11} /></button>
                                        <button onClick={() => { materialUnitStore.delete(u.id); reload(); }}
                                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={11} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 物料弹窗 */}
      {libForm.open && (
        <LibItemFormModal
          item={libForm.item}
          existingCategories={[...new Set(items.map(i => i.category))]}
          onClose={() => setLibForm({ open: false, item: null })}
          onDone={() => { setLibForm({ open: false, item: null }); reload(); }}
        />
      )}

      {/* 单体弹窗 */}
      {unitForm && (
        <UnitFormModal
          libItemId={unitForm.libItemId}
          unit={unitForm.unit}
          partners={partners}
          onClose={() => setUnitForm(null)}
          onDone={() => { setUnitForm(null); reload(); }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 客户端
// ════════════════════════════════════════════════════════════════════════
function PartnerSamplesView({ partnerId }: { partnerId: string }) {
  const borrowedUnits = useMemo(() => {
    const lib = materialLibStore.list();
    return materialUnitStore.byPartner(partnerId)
      .filter(u => u.status === "已发出")
      .map(u => ({ ...u, itemName: lib.find(i => i.id === u.libItemId)?.name ?? "未知物料" }));
  }, [partnerId]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">当前借出物料</h2>

      {borrowedUnits.length === 0 ? (
        <EmptyState text="暂无借出物料" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">物料名称</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">序列号</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">状态</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">预计归还</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {borrowedUnits.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.itemName}</td>
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">{u.serial}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.expectedReturnDate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 物料库 表单弹窗
// ════════════════════════════════════════════════════════════════════════
function LibItemFormModal({ item, existingCategories, onClose, onDone }: {
  item: MaterialLibItem | null;
  existingCategories: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? "",
    category: item?.category ?? "",
    customCategory: "",
    notes: item?.notes ?? "",
    trackable: item?.trackable ?? false,
  });
  const [useCustom, setUseCustom] = useState(false);
  const [err, setErr] = useState("");
  function s(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    const cat = useCustom ? form.customCategory.trim() : form.category;
    if (!form.name.trim() || !cat) { setErr("名称和分类为必填"); return; }
    const data = { name: form.name.trim(), category: cat, notes: form.notes, trackable: form.trackable };
    if (item) materialLibStore.update(item.id, data);
    else materialLibStore.create(data);
    onDone();
  }

  return (
    <Modal title={item ? "编辑物料" : "添加物料"} onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        <Field label="物料名称" required>
          <input className={inp} value={form.name} onChange={e => s("name", e.target.value)} placeholder="如：智能钢琴样机" />
        </Field>
        <Field label="分类" required>
          {!useCustom ? (
            <div className="flex gap-2">
              <select className={inp} value={form.category} onChange={e => s("category", e.target.value)}>
                <option value="">选择分类</option>
                {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => setUseCustom(true)} className="text-xs text-indigo-600 whitespace-nowrap hover:underline px-2">
                + 新分类
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input className={inp} value={form.customCategory} onChange={e => s("customCategory", e.target.value)} placeholder="输入新分类名" />
              <button onClick={() => setUseCustom(false)} className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap px-2">取消</button>
            </div>
          )}
        </Field>
        <Field label="备注">
          <input className={inp} value={form.notes} onChange={e => s("notes", e.target.value)} placeholder="可选说明" />
        </Field>
        <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer hover:bg-amber-100/60 transition-colors">
          <input type="checkbox" checked={form.trackable} onChange={e => s("trackable", e.target.checked)}
            className="w-4 h-4 rounded accent-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-800">开启序列号追踪</p>
            <p className="text-xs text-amber-600 mt-0.5">适用于样机、设备等需要记录借出/归还的实物</p>
          </div>
        </label>
        <div className="flex gap-3 pt-1">
          <Btn onClick={submit}>{item ? "保存" : "添加"}</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 单体追踪 表单弹窗
// ════════════════════════════════════════════════════════════════════════
function UnitFormModal({ libItemId, unit, partners, onClose, onDone }: {
  libItemId: string;
  unit: MaterialUnit | null;
  partners: ReturnType<typeof partnerStore.list>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    serial: unit?.serial ?? "",
    status: (unit?.status ?? "在库") as UnitStatus,
    currentPartnerId: unit?.currentPartnerId ?? "",
    expectedReturnDate: unit?.expectedReturnDate ?? "",
    notes: unit?.notes ?? "",
  });
  const [err, setErr] = useState("");
  function s(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.serial.trim()) { setErr("序列号为必填"); return; }
    const data = {
      libItemId,
      serial: form.serial.trim(),
      status: form.status,
      currentPartnerId: form.currentPartnerId || null,
      expectedReturnDate: form.expectedReturnDate || null,
      notes: form.notes,
    };
    if (unit) materialUnitStore.update(unit.id, data);
    else materialUnitStore.create(data);
    onDone();
  }

  return (
    <Modal title={unit ? "编辑单体" : "添加单体"} onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        <Field label="序列号 / 编号" required>
          <input className={inp} value={form.serial} onChange={e => s("serial", e.target.value)} placeholder="唯一标识" />
        </Field>
        <Field label="当前状态">
          <select className={inp} value={form.status} onChange={e => s("status", e.target.value)}>
            {(["在库", "已发出", "已归还"] as UnitStatus[]).map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </Field>
        {form.status === "已发出" && (
          <>
            <Field label="持有琴行">
              <select className={inp} value={form.currentPartnerId} onChange={e => s("currentPartnerId", e.target.value)}>
                <option value="">请选择</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.storeName}</option>)}
              </select>
            </Field>
            <Field label="预计归还日期">
              <input type="date" className={inp} value={form.expectedReturnDate} onChange={e => s("expectedReturnDate", e.target.value)} />
            </Field>
          </>
        )}
        <Field label="备注">
          <input className={inp} value={form.notes} onChange={e => s("notes", e.target.value)} placeholder="可选" />
        </Field>
        <div className="flex gap-3 pt-1">
          <Btn onClick={submit}>{unit ? "保存" : "添加"}</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}
