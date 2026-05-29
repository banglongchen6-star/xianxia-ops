"use client";
import { useState } from "react";
import { Project } from "@/lib/ops/types";
import { activityMaterialStore, materialStore } from "@/lib/ops/store";
import { inp, Field, Btn, Modal, EmptyState } from "./ui";
import { Plus, Check, Package } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════
// 物料清单（项目详情 Tab，双方均可操作）
// ════════════════════════════════════════════════════════════════════════
export default function MaterialsTab({ project, isCompany }: { project: Project; isCompany: boolean }) {
  const [items, setItems] = useState(() => activityMaterialStore.byProject(project.id));
  const [addOpen, setAddOpen] = useState(false);

  function reload() { setItems(activityMaterialStore.byProject(project.id)); }

  function toggleDone(id: string, done: boolean) {
    activityMaterialStore.update(id, { done: !done });
    reload();
  }

  const done = items.filter(i => i.done).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-800">物料清单</h3>
          {items.length > 0 && (
            <span className="text-xs text-gray-400">{done}/{items.length} 已就绪</span>
          )}
        </div>
        <Btn onClick={() => setAddOpen(true)}>
          <span className="flex items-center gap-1.5"><Plus size={14} />添加物料</span>
        </Btn>
      </div>

      {items.length === 0 && <EmptyState text="暂无物料清单，点击添加" />}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${item.done ? "bg-green-50 border-green-100" : "bg-white border-gray-100"}`}>
            <button onClick={() => toggleDone(item.id, item.done)}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.done ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-indigo-400"}`}>
              {item.done && <Check size={11} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm ${item.done ? "text-green-700 line-through" : "text-gray-800"}`}>
                  {item.materialName}
                </p>
                <span className="text-xs text-gray-400">×{item.quantity}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.preparedBy === "公司" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                  {item.preparedBy}准备
                </span>
              </div>
              {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
            </div>
            <button onClick={() => { activityMaterialStore.delete(item.id); reload(); }}
              className="text-xs text-gray-300 hover:text-red-400 px-2 py-1">删</button>
          </div>
        ))}
      </div>

      {addOpen && (
        <AddMaterialModal
          projectId={project.id}
          onClose={() => setAddOpen(false)}
          onDone={() => { setAddOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

// ── 添加物料弹窗 ────────────────────────────────────────────────────────
function AddMaterialModal({ projectId, onClose, onDone }: {
  projectId: string; onClose: () => void; onDone: () => void;
}) {
  const masterList = materialStore.list();
  const [mode, setMode] = useState<"library" | "custom">("library");
  const [selectedId, setSelectedId] = useState("");
  const [customName, setCustomName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [preparedBy, setPreparedBy] = useState<"公司" | "琴行">("公司");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    const name = mode === "library"
      ? masterList.find(m => m.id === selectedId)?.name ?? ""
      : customName.trim();

    if (!name) { setErr("请填写物料名称"); return; }
    activityMaterialStore.create({
      projectId,
      materialId: mode === "library" ? selectedId : null,
      materialName: name,
      quantity: parseInt(quantity) || 1,
      preparedBy,
      done: false,
      notes,
    });
    onDone();
  }

  return (
    <Modal title="添加物料" onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        {/* 来源切换 */}
        <div className="flex gap-3 mb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={mode === "library"} onChange={() => setMode("library")} />
            <span className="text-sm">从物料库选择</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={mode === "custom"} onChange={() => setMode("custom")} />
            <span className="text-sm">临时添加</span>
          </label>
        </div>

        {mode === "library" ? (
          <Field label="选择物料" required>
            {masterList.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">物料主库为空，请先在「样品物料」中添加</p>
            ) : (
              <select className={inp} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                <option value="">请选择</option>
                {masterList.map(m => (
                  <option key={m.id} value={m.id}>{m.name}（{m.category}）</option>
                ))}
              </select>
            )}
          </Field>
        ) : (
          <Field label="物料名称" required>
            <input className={inp} value={customName} onChange={e => setCustomName(e.target.value)} placeholder="如：横幅、桌签等" />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="数量">
            <input type="number" className={inp} value={quantity} min={1} onChange={e => setQuantity(e.target.value)} />
          </Field>
          <Field label="由谁准备">
            <select className={inp} value={preparedBy} onChange={e => setPreparedBy(e.target.value as "公司" | "琴行")}>
              <option value="公司">公司</option>
              <option value="琴行">琴行</option>
            </select>
          </Field>
        </div>

        <Field label="备注">
          <input className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="可选" />
        </Field>

        <div className="flex gap-3 pt-1">
          <Btn onClick={submit}>添加</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}
