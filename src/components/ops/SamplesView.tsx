"use client";
import { useState, useMemo } from "react";
import { Ctx } from "@/lib/ops/ctx";
import { materialLibStore, materialUnitStore, partnerStore } from "@/lib/ops/store";
import { MaterialLibItem, MaterialUnit, UnitStatus } from "@/lib/ops/types";
import { inp, Btn, Modal, Field, EmptyState } from "./ui";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

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
// 公司端 — Excel 风格内联编辑表格
// ════════════════════════════════════════════════════════════════════════

type RowDraft = { name: string; category: string; notes: string; trackable: boolean };

function CompanySamplesView() {
  const [items, setItems] = useState(() => materialLibStore.list());
  const [units, setUnits] = useState(() => materialUnitStore.list());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // drafts: rowId → pending edits (unsaved)
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  // new blank row being typed
  const [newRow, setNewRow] = useState<RowDraft | null>(null);
  const [unitForm, setUnitForm] = useState<{ open: boolean; libItemId: string; unit: MaterialUnit | null } | null>(null);

  const reload = () => { setItems(materialLibStore.list()); setUnits(materialUnitStore.list()); };
  const partners = useMemo(() => partnerStore.list(), []);

  function cellClass(focus?: boolean) {
    return `w-full px-2 py-1.5 text-sm bg-transparent outline-none border border-transparent rounded
      ${focus ? "" : "hover:border-gray-200 focus:border-indigo-400 focus:bg-white focus:shadow-sm"}
      transition-all`;
  }

  // save a draft row back to store
  function saveRow(id: string) {
    const d = drafts[id];
    if (!d) return;
    if (!d.name.trim()) return; // don't save empty
    materialLibStore.update(id, { name: d.name.trim(), category: d.category.trim(), notes: d.notes, trackable: d.trackable });
    setDrafts(prev => { const n = { ...prev }; delete n[id]; return n; });
    reload();
  }

  function patchDraft(id: string, key: keyof RowDraft, val: string | boolean) {
    setDrafts(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? rowToDraft(items.find(i => i.id === id)!)), [key]: val },
    }));
  }

  function rowToDraft(item: MaterialLibItem): RowDraft {
    return { name: item.name, category: item.category, notes: item.notes, trackable: item.trackable };
  }

  function addNewRow() {
    setNewRow({ name: "", category: "", notes: "", trackable: false });
  }

  function commitNewRow() {
    if (!newRow || !newRow.name.trim()) { setNewRow(null); return; }
    materialLibStore.create({ name: newRow.name.trim(), category: newRow.category.trim(), notes: newRow.notes, trackable: newRow.trackable });
    setNewRow(null);
    reload();
  }

  function getVal(item: MaterialLibItem, key: keyof RowDraft): string | boolean {
    return drafts[item.id] ? drafts[item.id][key] : (item as never as Record<keyof RowDraft, string | boolean>)[key];
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">物料库</h2>
        <p className="text-xs text-gray-400 mt-0.5">直接在表格中编辑，失去焦点自动保存；开启追踪后可管理序列号</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 表头 */}
        <div className="grid grid-cols-[2fr_1.2fr_2fr_90px_44px] gap-0 bg-gray-50 border-b border-gray-100 px-3 py-2">
          <span className="text-xs font-semibold text-gray-400">名称</span>
          <span className="text-xs font-semibold text-gray-400">分类</span>
          <span className="text-xs font-semibold text-gray-400">备注</span>
          <span className="text-xs font-semibold text-gray-400 text-center">追踪序列号</span>
          <span />
        </div>

        {/* 数据行 */}
        {items.map(item => {
          const itemUnits = units.filter(u => u.libItemId === item.id);
          const isExpanded = expandedId === item.id;
          const trackable = getVal(item, "trackable") as boolean;

          return (
            <div key={item.id} className="border-b border-gray-50 last:border-b-0">
              <div className="grid grid-cols-[2fr_1.2fr_2fr_90px_44px] gap-0 items-center px-3 py-1 hover:bg-gray-50/60 group">
                {/* 名称 */}
                <input
                  className={cellClass()}
                  value={getVal(item, "name") as string}
                  onChange={e => patchDraft(item.id, "name", e.target.value)}
                  onBlur={() => saveRow(item.id)}
                />
                {/* 分类 */}
                <input
                  className={cellClass()}
                  value={getVal(item, "category") as string}
                  onChange={e => patchDraft(item.id, "category", e.target.value)}
                  onBlur={() => saveRow(item.id)}
                  placeholder="如：样品"
                />
                {/* 备注 */}
                <input
                  className={cellClass()}
                  value={getVal(item, "notes") as string}
                  onChange={e => patchDraft(item.id, "notes", e.target.value)}
                  onBlur={() => saveRow(item.id)}
                  placeholder="—"
                />
                {/* 追踪序列号 */}
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    checked={trackable}
                    onChange={e => {
                      patchDraft(item.id, "trackable", e.target.checked);
                      // immediate save for checkbox
                      const d = drafts[item.id] ?? rowToDraft(item);
                      materialLibStore.update(item.id, { ...d, trackable: e.target.checked, name: d.name || item.name });
                      reload();
                    }}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                  {trackable && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="flex items-center gap-0.5 text-xs text-amber-600 hover:text-amber-800 px-1 py-0.5 hover:bg-amber-50 rounded transition-colors"
                    >
                      {itemUnits.length}件
                      {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    </button>
                  )}
                </div>
                {/* 删除 */}
                <div className="flex justify-center">
                  <button
                    onClick={() => { if (confirm(`删除「${item.name}」？`)) { materialLibStore.delete(item.id); reload(); } }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* 序列号追踪展开区 */}
              {isExpanded && item.trackable && (
                <div className="bg-amber-50/40 border-t border-amber-100 px-5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-amber-700">序列号追踪</p>
                    <button
                      onClick={() => setUnitForm({ open: true, libItemId: item.id, unit: null })}
                      className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 px-2 py-1 hover:bg-amber-100 rounded-lg transition-colors"
                    >
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

        {/* 新增行（输入中） */}
        {newRow && (
          <div className="grid grid-cols-[2fr_1.2fr_2fr_90px_44px] gap-0 items-center px-3 py-1 bg-indigo-50/30 border-b border-indigo-100">
            <input
              autoFocus
              className={cellClass()}
              placeholder="物料名称"
              value={newRow.name}
              onChange={e => setNewRow(r => ({ ...r!, name: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") commitNewRow(); if (e.key === "Escape") setNewRow(null); }}
            />
            <input
              className={cellClass()}
              placeholder="分类"
              value={newRow.category}
              onChange={e => setNewRow(r => ({ ...r!, category: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") commitNewRow(); if (e.key === "Escape") setNewRow(null); }}
            />
            <input
              className={cellClass()}
              placeholder="备注（可选）"
              value={newRow.notes}
              onChange={e => setNewRow(r => ({ ...r!, notes: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") commitNewRow(); if (e.key === "Escape") setNewRow(null); }}
            />
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={newRow.trackable}
                onChange={e => setNewRow(r => ({ ...r!, trackable: e.target.checked }))}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-center gap-1">
              <button onClick={commitNewRow} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-1">✓</button>
              <button onClick={() => setNewRow(null)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
            </div>
          </div>
        )}

        {/* 添加一行按钮 */}
        {!newRow && (
          <button
            onClick={addNewRow}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors"
          >
            <Plus size={14} /><span>添加一行</span>
          </button>
        )}
      </div>

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
