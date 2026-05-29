"use client";
import { useState, useMemo } from "react";
import { Project, ChecklistItem, MaterialRequest } from "@/lib/ops/types";
import { checklistStore, materialRequestStore, materialLibStore, partnerStore } from "@/lib/ops/store";
import { inp, Field, Btn, Modal, EmptyState } from "./ui";
import {
  Plus, Trash2, Lock, Truck, CheckCircle2, Pencil,
  Package, User, ChevronDown, ChevronUp,
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  "待处理": "bg-amber-50 text-amber-700 border border-amber-200",
  "已锁定": "bg-blue-50 text-blue-700 border border-blue-200",
  "已完成": "bg-green-50 text-green-700 border border-green-200",
};

// ════════════════════════════════════════════════════════════════════════
// 物料清单 Tab
// ════════════════════════════════════════════════════════════════════════
export default function MaterialsTab({ project, isCompany }: { project: Project; isCompany: boolean }) {
  const [items, setItems] = useState(() => checklistStore.byProject(project.id));
  const [request, setRequest] = useState(() => materialRequestStore.byProject(project.id));
  const [addOpen, setAddOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [showShipping, setShowShipping] = useState(false);

  // 收货信息 pre-fill from partner
  const partnerInfo = useMemo(() => partnerStore.get(project.partnerId), [project.partnerId]);
  const [receiverName, setReceiverName] = useState(partnerInfo?.contactName ?? "");
  const [receiverPhone, setReceiverPhone] = useState(partnerInfo?.phone ?? "");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [partnerNotes, setPartnerNotes] = useState("");

  const reload = () => {
    setItems(checklistStore.byProject(project.id));
    setRequest(materialRequestStore.byProject(project.id));
  };

  const companyItems = items.filter(i => i.preparedBy === "公司备");
  const hasRequest = !!request;
  const isLocked = request?.status === "已锁定" || request?.status === "已完成";
  const isDone = request?.status === "已完成";
  const allFilled = items.length > 0 && items.every(i => i.preparedBy !== null);

  // ── 客户端提交 ──────────────────────────────────────────────────────
  function submitChecklist() {
    if (!allFilled) { alert("请为所有物料选择备货方式"); return; }
    const hasCompany = companyItems.length > 0;
    if (hasCompany && !receiverAddress.trim()) { alert("有公司备物料，请填写收货地址"); return; }
    materialRequestStore.create({
      projectId: project.id,
      partnerId: project.partnerId,
      status: hasCompany ? "待处理" : "已完成",
      receiverName, receiverPhone, receiverAddress, partnerNotes,
      trackingNumbers: [],
      companyNotes: "",
      lockedAt: hasCompany ? null : new Date().toISOString(),
      completedAt: hasCompany ? null : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    reload();
  }

  // ── 公司锁定 ────────────────────────────────────────────────────────
  function lockRequest() {
    if (!confirm("锁定后物料清单不可再修改，确认？")) return;
    materialRequestStore.update(request!.id, {
      status: "已锁定",
      lockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    reload();
  }

  // ── 公司填快递单号 ──────────────────────────────────────────────────
  function addTracking() {
    if (!trackingInput.trim()) return;
    materialRequestStore.update(request!.id, {
      trackingNumbers: [...(request!.trackingNumbers), trackingInput.trim()],
      status: "已完成",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setTrackingInput("");
    reload();
  }

  // ── 切换备货方式（客户端） ───────────────────────────────────────────
  function togglePreparedBy(id: string, current: "自备" | "公司备" | null) {
    checklistStore.update(id, { preparedBy: current === "公司备" ? "自备" : "公司备" });
    reload();
  }

  return (
    <div>
      {/* ── 标题栏 ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-800">物料清单</h3>
          {request && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[request.status]}`}>
              {request.status === "已完成" ? "✓ 已完成" : request.status}
            </span>
          )}
        </div>
        {/* 公司端：提交前可添加 */}
        {isCompany && !hasRequest && (
          <Btn onClick={() => setAddOpen(true)}>
            <span className="flex items-center gap-1.5"><Plus size={14} />添加物料</span>
          </Btn>
        )}
        {/* 客户端：提交前可添加 */}
        {!isCompany && !hasRequest && items.length > 0 && (
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors">
            <Plus size={14} />添加物料
          </button>
        )}
      </div>

      {/* ── 空状态 ── */}
      {items.length === 0 && !hasRequest && (
        isCompany ? (
          <div className="text-center py-10">
            <Package size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-3">从物料库选择本次活动所需物料，发给客户确认备货方式</p>
            <Btn onClick={() => setAddOpen(true)}>
              <span className="flex items-center gap-1.5"><Plus size={14} />添加物料</span>
            </Btn>
          </div>
        ) : (
          <EmptyState text="公司正在准备物料清单，请稍候" />
        )
      )}

      {/* ── 清单条目 ── */}
      {items.length > 0 && (
        <div className="space-y-2 mb-4">
          {items.map(item => (
            <ChecklistRow
              key={item.id}
              item={item}
              isCompany={isCompany}
              canDelete={isCompany && !hasRequest}
              canToggle={!isCompany && !hasRequest}
              canEditNotes={isCompany && request?.status === "待处理" && item.preparedBy === "公司备"}
              onToggle={() => togglePreparedBy(item.id, item.preparedBy)}
              onDelete={() => { checklistStore.delete(item.id); reload(); }}
              onSaveNotes={notes => { checklistStore.update(item.id, { companyNotes: notes }); reload(); }}
            />
          ))}
        </div>
      )}

      {/* ── 客户端：收货信息 + 提交 ── */}
      {!isCompany && !hasRequest && items.length > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          {companyItems.length > 0 && (
            <div className="space-y-2">
              <button onClick={() => setShowShipping(s => !s)}
                className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-800">
                <User size={13} />收货信息
                {showShipping ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                <span className="text-gray-400">{receiverAddress ? receiverAddress.slice(0, 20) + "…" : "（点击填写）"}</span>
              </button>
              {showShipping && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="收货人">
                      <input className={inp} value={receiverName} onChange={e => setReceiverName(e.target.value)} />
                    </Field>
                    <Field label="手机号">
                      <input className={inp} value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} inputMode="numeric" />
                    </Field>
                  </div>
                  <Field label="收货地址" required>
                    <input className={inp} value={receiverAddress} onChange={e => setReceiverAddress(e.target.value)} placeholder="省市区 + 详细地址" />
                  </Field>
                  <Field label="备注">
                    <input className={inp} value={partnerNotes} onChange={e => setPartnerNotes(e.target.value)} placeholder="如：请活动前3天发出" />
                  </Field>
                </div>
              )}
            </div>
          )}
          <Btn onClick={submitChecklist} disabled={!allFilled}>
            提交物料清单
          </Btn>
          {!allFilled && <p className="text-xs text-gray-400">请为所有条目选择备货方式后提交</p>}
        </div>
      )}

      {/* ── 客户端：已提交状态 ── */}
      {!isCompany && hasRequest && (
        <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-500">
          {request!.status === "待处理" && "已提交，等待公司确认处理"}
          {request!.status === "已锁定" && "公司已确认，等待发货"}
          {request!.status === "已完成" && companyItems.length === 0 && "清单已完成（全部自备）"}
          {request!.status === "已完成" && companyItems.length > 0 && "已发货，请注意查收"}
        </div>
      )}

      {/* ── 公司端：待处理 → 收货信息 + 锁定 ── */}
      {isCompany && request?.status === "待处理" && (
        <div className="border-t border-gray-100 pt-4 mt-2">
          <div className="flex items-start justify-between gap-4">
            <div className="text-xs text-gray-500 space-y-0.5">
              <p className="font-medium text-gray-700 mb-1">收货信息</p>
              <p>{request.receiverName}　{request.receiverPhone}</p>
              <p>{request.receiverAddress}</p>
              {request.partnerNotes && <p className="text-gray-400">备注：{request.partnerNotes}</p>}
            </div>
            <Btn onClick={lockRequest}>
              <span className="flex items-center gap-1.5"><Lock size={13} />锁定确认</span>
            </Btn>
          </div>
        </div>
      )}

      {/* ── 公司端：已锁定 → 填快递单号 ── */}
      {isCompany && request?.status === "已锁定" && (
        <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
          <div className="text-xs text-gray-500 space-y-0.5">
            <p className="font-medium text-gray-700 mb-1">收货信息</p>
            <p>{request.receiverName}　{request.receiverPhone}</p>
            <p>{request.receiverAddress}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">填写快递单号（保存后自动完成）</p>
            <div className="flex gap-2">
              <input className={inp + " flex-1"}
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                placeholder="输入快递单号"
                onKeyDown={e => e.key === "Enter" && addTracking()}
              />
              <Btn onClick={addTracking}>保存</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── 快递单号展示 ── */}
      {(request?.trackingNumbers ?? []).length > 0 && (
        <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
          <p className="text-xs font-medium text-green-700 mb-1.5 flex items-center gap-1.5">
            <Truck size={12} />快递单号
          </p>
          {request!.trackingNumbers.map((tn, i) => (
            <p key={i} className="text-sm font-mono text-green-800">{tn}</p>
          ))}
        </div>
      )}

      {/* ── 添加物料弹窗 ── */}
      {addOpen && (
        <AddChecklistItemModal
          projectId={project.id}
          isCompany={isCompany}
          onClose={() => setAddOpen(false)}
          onDone={() => { setAddOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 清单条目行
// ════════════════════════════════════════════════════════════════════════
function ChecklistRow({ item, isCompany, canDelete, canToggle, canEditNotes, onToggle, onDelete, onSaveNotes }: {
  item: ChecklistItem;
  isCompany: boolean;
  canDelete: boolean;
  canToggle: boolean;
  canEditNotes: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSaveNotes: (notes: string) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(item.companyNotes);

  const bg = item.preparedBy === "公司备"
    ? "bg-blue-50/50 border-blue-100"
    : item.preparedBy === "自备"
    ? "bg-gray-50 border-gray-100"
    : "bg-white border-gray-100";

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${bg}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-800">{item.name}</span>
          <span className="text-xs text-gray-400">×{item.quantity}</span>
          {item.source === "partner" && (
            <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full border border-purple-100">客户添加</span>
          )}
          {item.preparedBy && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              item.preparedBy === "公司备" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
            }`}>{item.preparedBy}</span>
          )}
        </div>
        {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
        {item.companyNotes && !editingNotes && (
          <p className="text-xs text-blue-500 mt-0.5">公司备注：{item.companyNotes}</p>
        )}
        {editingNotes && (
          <div className="flex gap-1 mt-1">
            <input autoFocus className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              value={notesVal} onChange={e => setNotesVal(e.target.value)}
              placeholder="公司备注"
              onKeyDown={e => {
                if (e.key === "Enter") { onSaveNotes(notesVal); setEditingNotes(false); }
                if (e.key === "Escape") setEditingNotes(false);
              }} />
            <button onClick={() => { onSaveNotes(notesVal); setEditingNotes(false); }}
              className="text-xs text-indigo-600 px-2 hover:text-indigo-800">保存</button>
          </div>
        )}
      </div>

      {/* 客户端切换按钮 */}
      {canToggle && (
        <div className="flex gap-1 shrink-0">
          <button onClick={() => item.preparedBy !== "自备" && onToggle()}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              item.preparedBy === "自备"
                ? "bg-gray-200 text-gray-700 border-gray-200 font-medium"
                : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
            }`}>自备</button>
          <button onClick={() => item.preparedBy !== "公司备" && onToggle()}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              item.preparedBy === "公司备"
                ? "bg-blue-500 text-white border-blue-500 font-medium"
                : "bg-white border-gray-200 text-gray-400 hover:border-blue-300"
            }`}>公司备</button>
        </div>
      )}

      {/* 公司端备注编辑 */}
      {canEditNotes && !editingNotes && (
        <button onClick={() => setEditingNotes(true)}
          className="p-1.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors shrink-0">
          <Pencil size={12} />
        </button>
      )}

      {/* 删除 */}
      {canDelete && (
        <button onClick={onDelete}
          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 添加物料弹窗
// ════════════════════════════════════════════════════════════════════════
function AddChecklistItemModal({ projectId, isCompany, onClose, onDone }: {
  projectId: string;
  isCompany: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const libItems = useMemo(() => materialLibStore.list(), []);
  const [mode, setMode] = useState<"library" | "custom">(libItems.length > 0 ? "library" : "custom");
  const [selectedLibId, setSelectedLibId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [preparedBy, setPreparedBy] = useState<"自备" | "公司备" | null>(isCompany ? null : null);
  const [err, setErr] = useState("");

  function submit() {
    const libItem = mode === "library" ? libItems.find(i => i.id === selectedLibId) : null;
    const name = mode === "library" ? (libItem?.name ?? "") : customName.trim();
    const category = mode === "library" ? (libItem?.category ?? "") : customCategory.trim();
    if (!name) { setErr("请填写物料名称"); return; }
    checklistStore.create({
      projectId,
      libItemId: mode === "library" ? selectedLibId : null,
      name,
      category,
      source: isCompany ? "company" : "partner",
      preparedBy: isCompany ? null : preparedBy,
      quantity: parseInt(quantity) || 1,
      notes,
      companyNotes: "",
    });
    onDone();
  }

  return (
    <Modal title="添加物料" onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        {libItems.length > 0 && (
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={mode === "library"} onChange={() => setMode("library")} />
              从物料库选择
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={mode === "custom"} onChange={() => setMode("custom")} />
              自定义添加
            </label>
          </div>
        )}

        {mode === "library" ? (
          <Field label="选择物料" required>
            <select className={inp} value={selectedLibId} onChange={e => setSelectedLibId(e.target.value)}>
              <option value="">请选择</option>
              {libItems.map(m => <option key={m.id} value={m.id}>{m.name}（{m.category}）</option>)}
            </select>
          </Field>
        ) : (
          <>
            <Field label="物料名称" required>
              <input className={inp} value={customName} onChange={e => setCustomName(e.target.value)} placeholder="如：横幅、桌签等" />
            </Field>
            <Field label="分类">
              <input className={inp} value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="如：宣传物料" />
            </Field>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="数量">
            <input type="number" className={inp} value={quantity} min={1} onChange={e => setQuantity(e.target.value)} />
          </Field>
          {/* 客户端直接选备货方式 */}
          {!isCompany && (
            <Field label="备货方式">
              <select className={inp} value={preparedBy ?? ""} onChange={e => setPreparedBy(e.target.value as "自备" | "公司备")}>
                <option value="">待选择</option>
                <option value="自备">自备</option>
                <option value="公司备">公司备</option>
              </select>
            </Field>
          )}
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
