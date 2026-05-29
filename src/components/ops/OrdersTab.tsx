"use client";
import { useState, useMemo } from "react";
import { Project, Order, OrderItem, ShippingStatus } from "@/lib/ops/types";
import { orderStore, productStore } from "@/lib/ops/store";
import { inp, Field, Btn, Modal, EmptyState } from "./ui";
import { Plus, Trash2, Package, Truck, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

const SHIPPING_COLORS: Record<ShippingStatus, string> = {
  待发货: "bg-amber-100 text-amber-700",
  已发货: "bg-blue-100 text-blue-700",
  已签收: "bg-green-100 text-green-700",
};

// ════════════════════════════════════════════════════════════════════════
// 订单列表（项目详情中的 Tab）
// ════════════════════════════════════════════════════════════════════════
export default function OrdersTab({ project, isCompany }: { project: Project; isCompany: boolean }) {
  const [orders, setOrders] = useState(() => orderStore.byProject(project.id));
  const [formOpen, setFormOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  function reload() { setOrders(orderStore.byProject(project.id)); }

  const canCreate = !isCompany && (
    project.status === "执行中" || project.status === "待结算" || project.status === "已结算"
  );

  const totalAmount = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCommission = orders.reduce((s, o) => s + o.totalCommission, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-800">订单列表</h3>
          {orders.length > 0 && (
            <div className="flex gap-3 text-xs text-gray-500">
              <span>合计销售 <strong className="text-gray-800">¥{totalAmount.toLocaleString()}</strong></span>
              <span>合计提成 <strong className="text-green-600">¥{totalCommission.toLocaleString()}</strong></span>
            </div>
          )}
        </div>
        {canCreate && (
          <Btn onClick={() => setFormOpen(true)}>
            <span className="flex items-center gap-1.5"><Plus size={14} />新建订单</span>
          </Btn>
        )}
      </div>

      {orders.length === 0 && <EmptyState text="暂无订单" />}

      <div className="space-y-3">
        {orders.map(o => (
          <OrderCard key={o.id} order={o} isCompany={isCompany}
            expanded={expanded === o.id}
            onToggle={() => setExpanded(expanded === o.id ? null : o.id)}
            onUpdate={reload}
            onDelete={() => { if (confirm("确认删除该订单？")) { orderStore.delete(o.id); reload(); } }}
          />
        ))}
      </div>

      {formOpen && (
        <OrderFormModal
          project={project}
          isCompany={isCompany}
          onClose={() => setFormOpen(false)}
          onDone={() => { setFormOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

// ── 订单卡片 ────────────────────────────────────────────────────────────
function OrderCard({ order: o, isCompany, expanded, onToggle, onUpdate, onDelete }: {
  order: Order; isCompany: boolean; expanded: boolean;
  onToggle: () => void; onUpdate: () => void; onDelete: () => void;
}) {
  const [shippingOpen, setShippingOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
            <Package size={14} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{o.customerName}</p>
            <p className="text-xs text-gray-400">{o.customerPhone} · {o.items.length} 件产品</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">¥{o.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-green-600">提成 ¥{o.totalCommission.toLocaleString()}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIPPING_COLORS[o.shippingStatus]}`}>
            {o.shippingStatus}
          </span>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">收货地址</p>
              <p className="text-gray-700">{o.customerAddress || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">收款方</p>
              <p className="text-gray-700">{o.paymentSide}</p>
            </div>
            {o.trackingNumber && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">快递单号</p>
                <p className="text-gray-700 font-mono text-xs">{o.trackingNumber}</p>
              </div>
            )}
            {o.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">备注</p>
                <p className="text-gray-600 text-xs">{o.notes}</p>
              </div>
            )}
          </div>

          {/* 产品明细 */}
          <div className="bg-gray-50 rounded-lg overflow-hidden mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-gray-400 font-medium">产品</th>
                  <th className="text-right px-3 py-2 text-gray-400 font-medium">数量</th>
                  <th className="text-right px-3 py-2 text-gray-400 font-medium">单价</th>
                  <th className="text-right px-3 py-2 text-gray-400 font-medium">提成</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {o.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-700">{item.productName}</td>
                    <td className="px-3 py-2 text-gray-700 text-right">{item.qty}</td>
                    <td className="px-3 py-2 text-gray-700 text-right">¥{item.unitPrice}</td>
                    <td className="px-3 py-2 text-green-600 text-right">¥{item.commissionAmount.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 操作 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {isCompany && o.shippingStatus !== "已签收" && (
                <Btn variant="outline" onClick={() => setShippingOpen(true)}>
                  <span className="flex items-center gap-1"><Truck size={13} />更新物流</span>
                </Btn>
              )}
              {!isCompany && o.shippingStatus !== "已签收" && (
                <Btn variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-600">
                  <span className="flex items-center gap-1"><Trash2 size={13} />删除</span>
                </Btn>
              )}
            </div>
            <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("zh-CN")}</p>
          </div>
        </div>
      )}

      {shippingOpen && (
        <ShippingModal order={o} onClose={() => setShippingOpen(false)} onDone={() => { setShippingOpen(false); onUpdate(); }} />
      )}
    </div>
  );
}

// ── 物流更新 ────────────────────────────────────────────────────────────
function ShippingModal({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState<ShippingStatus>(order.shippingStatus);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");

  function save() {
    orderStore.update(order.id, {
      shippingStatus: status,
      trackingNumber: tracking.trim() || null,
    });
    onDone();
  }

  return (
    <Modal title="更新物流状态" onClose={onClose}>
      <div className="space-y-3">
        <Field label="物流状态">
          <div className="flex gap-3">
            {(["待发货", "已发货", "已签收"] as ShippingStatus[]).map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={status === s} onChange={() => setStatus(s)} />
                <span className="text-sm text-gray-700">{s}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="快递单号">
          <input className={inp} value={tracking} onChange={e => setTracking(e.target.value)} placeholder="填写后客户可查询" />
        </Field>
        <div className="flex gap-3 pt-1">
          <Btn onClick={save}>保存</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── 新建订单 ────────────────────────────────────────────────────────────
function OrderFormModal({ project, isCompany, onClose, onDone }: {
  project: Project; isCompany: boolean; onClose: () => void; onDone: () => void;
}) {
  const products = useMemo(() => productStore.list(), []);
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", customerAddress: "",
    paymentSide: "公司收款" as "公司收款" | "琴行收款",
    notes: "",
  });
  const [items, setItems] = useState<{ productId: string; qty: number; unitPrice: string }[]>([]);
  const [err, setErr] = useState("");

  function addItem() {
    setItems(prev => [...prev, { productId: "", qty: 1, unitPrice: "" }]);
  }
  function updateItem(i: number, key: string, val: string | number) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  }
  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }

  // 计算明细
  const computed: OrderItem[] = items.map(row => {
    const prod = products.find(p => p.id === row.productId);
    const qty = row.qty || 1;
    const unitPrice = parseFloat(row.unitPrice) || (prod?.price ?? 0);
    let commissionAmount = 0;
    if (prod) {
      if (prod.commissionType === "percent") {
        commissionAmount = unitPrice * qty * prod.commissionValue / 100;
      } else {
        commissionAmount = prod.commissionValue * qty;
      }
    }
    return {
      productId: row.productId,
      productName: prod?.name ?? "未知产品",
      qty,
      unitPrice,
      commissionType: prod?.commissionType ?? "fixed",
      commissionValue: prod?.commissionValue ?? 0,
      commissionAmount,
    };
  });

  const totalAmount = computed.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const totalCommission = computed.reduce((s, i) => s + i.commissionAmount, 0);

  function submit() {
    if (!form.customerName || !form.customerPhone) { setErr("客户姓名和电话为必填"); return; }
    if (items.length === 0) { setErr("请至少添加一件产品"); return; }
    const hasInvalid = items.some(i => !i.productId);
    if (hasInvalid) { setErr("请选择所有产品"); return; }

    orderStore.create({
      projectId: project.id,
      partnerId: project.partnerId,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerAddress: form.customerAddress,
      items: computed,
      totalAmount,
      totalCommission,
      paymentSide: form.paymentSide,
      shippingStatus: "待发货",
      trackingNumber: null,
      notes: form.notes,
    });
    onDone();
  }

  return (
    <Modal title="新建订单" onClose={onClose} wide>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-4">
        {/* 客户信息 */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="客户姓名" required>
            <input className={inp} value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
          </Field>
          <Field label="联系电话" required>
            <input className={inp} value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
          </Field>
        </div>
        <Field label="收货地址">
          <input className={inp} value={form.customerAddress} onChange={e => setForm(f => ({ ...f, customerAddress: e.target.value }))} placeholder="省市区详细地址" />
        </Field>
        <Field label="收款方">
          <div className="flex gap-4">
            {(["公司收款", "琴行收款"] as const).map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.paymentSide === v} onChange={() => setForm(f => ({ ...f, paymentSide: v }))} />
                <span className="text-sm text-gray-700">{v}</span>
              </label>
            ))}
          </div>
        </Field>

        {/* 产品明细 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">产品明细 <span className="text-red-400">*</span></label>
            <button onClick={addItem} className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
              <Plus size={12} />添加产品
            </button>
          </div>

          {items.length === 0 && (
            <div className="border border-dashed border-gray-200 rounded-lg py-6 text-center text-sm text-gray-300">
              点击「添加产品」
            </div>
          )}

          <div className="space-y-2">
            {items.map((item, i) => {
              const prod = products.find(p => p.id === item.productId);
              return (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <select className={inp} value={item.productId}
                      onChange={e => {
                        const p = products.find(x => x.id === e.target.value);
                        updateItem(i, "productId", e.target.value);
                        if (p) updateItem(i, "unitPrice", p.price.toString());
                      }}>
                      <option value="">选择产品</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}（{p.model}）</option>)}
                    </select>
                  </div>
                  <div className="w-16">
                    <input type="number" className={inp} value={item.qty} min={1}
                      onChange={e => updateItem(i, "qty", parseInt(e.target.value) || 1)}
                      placeholder="数量" />
                  </div>
                  <div className="w-24">
                    <input type="number" className={inp} value={item.unitPrice}
                      onChange={e => updateItem(i, "unitPrice", e.target.value)}
                      placeholder={prod ? prod.price.toString() : "单价"} />
                  </div>
                  <button onClick={() => removeItem(i)} className="p-2 text-gray-300 hover:text-red-400 mt-0.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* 合计预览 */}
          {items.length > 0 && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 flex justify-between text-sm">
              <span className="text-gray-500">合计销售额 <strong className="text-gray-800">¥{totalAmount.toFixed(0)}</strong></span>
              <span className="text-gray-500">合计提成 <strong className="text-green-600">¥{totalCommission.toFixed(0)}</strong></span>
            </div>
          )}
        </div>

        <Field label="备注">
          <textarea className={inp + " resize-none"} rows={2} value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </Field>

        <div className="flex gap-3 pt-1">
          <Btn onClick={submit}>创建订单</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}
