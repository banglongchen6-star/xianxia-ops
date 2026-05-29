"use client";
import { useState, useMemo } from "react";
import { Ctx } from "@/lib/ops/ctx";
import { sampleStore, materialStore, partnerStore } from "@/lib/ops/store";
import { Sample, SampleStatus, Material } from "@/lib/ops/types";
import { inp, Field, Btn, Modal, EmptyState } from "./ui";
import { Plus, Pencil, Trash2, Package2, Boxes } from "lucide-react";

const SAMPLE_STATUS_COLOR: Record<SampleStatus, string> = {
  在库: "bg-green-100 text-green-700",
  已发出: "bg-amber-100 text-amber-700",
  已归还: "bg-gray-100 text-gray-500",
};

type SubTab = "samples" | "materials";

// ════════════════════════════════════════════════════════════════════════
// 样品物料（顶层页面）
// ════════════════════════════════════════════════════════════════════════
export default function SamplesView({ ctx }: { ctx: Ctx }) {
  const isCompany = ctx.session.role === "company";
  const [tab, setTab] = useState<SubTab>("samples");

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">样品物料</h2>

      {/* 子标签 */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {([["samples", "样品库", Package2], ["materials", "物料主库", Boxes]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === "samples" && <SamplesTab isCompany={isCompany} ctx={ctx} />}
      {tab === "materials" && <MaterialsTab isCompany={isCompany} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 样品库
// ════════════════════════════════════════════════════════════════════════
function SamplesTab({ isCompany, ctx }: { isCompany: boolean; ctx: Ctx }) {
  const [samples, setSamples] = useState(() => sampleStore.list());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sample | null>(null);
  const [filter, setFilter] = useState<SampleStatus | "全部">("全部");
  const partners = useMemo(() => partnerStore.list(), []);

  function reload() { setSamples(sampleStore.list()); ctx.refresh(); }

  const filtered = filter === "全部" ? samples : samples.filter(s => s.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(["全部", "在库", "已发出", "已归还"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filter === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>
        {isCompany && (
          <Btn onClick={() => { setEditing(null); setFormOpen(true); }}>
            <span className="flex items-center gap-1.5"><Plus size={14} />添加样品</span>
          </Btn>
        )}
      </div>

      {filtered.length === 0 && <EmptyState text={filter === "全部" ? "暂无样品" : `没有「${filter}」的样品`} />}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">样品名称</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">型号</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">序列号</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">状态</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">持有琴行</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">预计归还</th>
                {isCompany && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => {
                const partner = partnerStore.get(s.currentPartnerId);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.model}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{s.serial}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SAMPLE_STATUS_COLOR[s.status]}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{partner?.storeName ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{s.expectedReturnDate ?? "—"}</td>
                    {isCompany && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => { setEditing(s); setFormOpen(true); }}
                            className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => { if (confirm(`确认删除「${s.name}」？`)) { sampleStore.delete(s.id); reload(); } }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <SampleFormModal
          sample={editing}
          partners={partners}
          onClose={() => setFormOpen(false)}
          onDone={() => { setFormOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

// ── 样品表单 ────────────────────────────────────────────────────────────
function SampleFormModal({ sample, partners, onClose, onDone }: {
  sample: Sample | null;
  partners: ReturnType<typeof partnerStore.list>;
  onClose: () => void; onDone: () => void;
}) {
  const [form, setForm] = useState({
    name: sample?.name ?? "",
    model: sample?.model ?? "",
    serial: sample?.serial ?? "",
    status: (sample?.status ?? "在库") as SampleStatus,
    currentPartnerId: sample?.currentPartnerId ?? "",
    expectedReturnDate: sample?.expectedReturnDate ?? "",
    notes: sample?.notes ?? "",
  });
  const [err, setErr] = useState("");
  function s(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.name || !form.serial) { setErr("样品名称和序列号为必填"); return; }
    const data = {
      name: form.name, model: form.model, serial: form.serial,
      status: form.status,
      currentPartnerId: form.currentPartnerId || null,
      expectedReturnDate: form.expectedReturnDate || null,
      notes: form.notes,
    };
    if (sample) sampleStore.update(sample.id, data);
    else sampleStore.create(data);
    onDone();
  }

  return (
    <Modal title={sample ? "编辑样品" : "添加样品"} onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="样品名称" required>
            <input className={inp} value={form.name} onChange={e => s("name", e.target.value)} placeholder="如：智能钢琴 X1" />
          </Field>
          <Field label="型号">
            <input className={inp} value={form.model} onChange={e => s("model", e.target.value)} />
          </Field>
        </div>
        <Field label="序列号/编号" required>
          <input className={inp} value={form.serial} onChange={e => s("serial", e.target.value)} placeholder="唯一标识" />
        </Field>
        <Field label="当前状态">
          <select className={inp} value={form.status} onChange={e => s("status", e.target.value)}>
            {(["在库", "已发出", "已归还"] as SampleStatus[]).map(st => (
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
          <textarea className={inp + " resize-none"} rows={2} value={form.notes} onChange={e => s("notes", e.target.value)} />
        </Field>
        <div className="flex gap-3 pt-1">
          <Btn onClick={submit}>{sample ? "保存" : "添加"}</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 物料主库
// ════════════════════════════════════════════════════════════════════════
function MaterialsTab({ isCompany }: { isCompany: boolean }) {
  const [materials, setMaterials] = useState(() => materialStore.list());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  function reload() { setMaterials(materialStore.list()); }

  // 按分类分组
  const grouped = useMemo(() => {
    const map: Record<string, Material[]> = {};
    materials.forEach(m => {
      if (!map[m.category]) map[m.category] = [];
      map[m.category].push(m);
    });
    return map;
  }, [materials]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">物料主库是所有活动物料清单的来源，在项目详情中可从此处选择添加。</p>
        {isCompany && (
          <Btn onClick={() => { setEditing(null); setFormOpen(true); }}>
            <span className="flex items-center gap-1.5"><Plus size={14} />添加物料</span>
          </Btn>
        )}
      </div>

      {materials.length === 0 && <EmptyState text="暂无物料，请先添加" />}

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{category}</h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">物料名称</th>
                    <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">备注</th>
                    {isCompany && <th className="px-4 py-2.5" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-800">{m.name}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{m.notes || "—"}</td>
                      {isCompany && (
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => { setEditing(m); setFormOpen(true); }}
                              className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => { if (confirm(`删除「${m.name}」？`)) { materialStore.delete(m.id); reload(); } }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {formOpen && (
        <MaterialFormModal
          material={editing}
          onClose={() => setFormOpen(false)}
          onDone={() => { setFormOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

// ── 物料表单 ────────────────────────────────────────────────────────────
function MaterialFormModal({ material, onClose, onDone }: {
  material: Material | null; onClose: () => void; onDone: () => void;
}) {
  const categories = useMemo(() => {
    const cats = [...new Set(materialStore.list().map(m => m.category))];
    return cats;
  }, []);

  const [form, setForm] = useState({
    name: material?.name ?? "",
    category: material?.category ?? "",
    customCategory: "",
    notes: material?.notes ?? "",
  });
  const [useCustom, setUseCustom] = useState(false);
  const [err, setErr] = useState("");

  function s(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    const cat = useCustom ? form.customCategory.trim() : form.category;
    if (!form.name || !cat) { setErr("名称和分类为必填"); return; }
    const data = { name: form.name, category: cat, notes: form.notes };
    if (material) materialStore.update(material.id, data);
    else materialStore.create(data);
    onDone();
  }

  return (
    <Modal title={material ? "编辑物料" : "添加物料"} onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        <Field label="物料名称" required>
          <input className={inp} value={form.name} onChange={e => s("name", e.target.value)} />
        </Field>
        <Field label="分类" required>
          {!useCustom ? (
            <div className="flex gap-2">
              <select className={inp} value={form.category} onChange={e => s("category", e.target.value)}>
                <option value="">选择分类</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
          <input className={inp} value={form.notes} onChange={e => s("notes", e.target.value)} />
        </Field>
        <div className="flex gap-3 pt-1">
          <Btn onClick={submit}>{material ? "保存" : "添加"}</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}
