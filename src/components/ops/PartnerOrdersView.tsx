"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { Ctx } from "@/lib/ops/ctx";
import { orderStore, projectStore, productStore } from "@/lib/ops/store";
import { Order, Project, ShippingStatus } from "@/lib/ops/types";
import { inp, Field, Btn, Modal, EmptyState } from "./ui";
import { Package, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const SHIP_COLOR: Record<ShippingStatus, string> = {
  待发货: "bg-amber-100 text-amber-700",
  已发货: "bg-blue-100 text-blue-700",
  已签收: "bg-green-100 text-green-700",
};

export default function PartnerOrdersView({ ctx }: { ctx: Ctx }) {
  const partnerId = ctx.session.partnerId!;
  const [ver, setVer] = useState(0);

  const projects = useMemo(() => projectStore.byPartner(partnerId), [ver, partnerId]);
  const allOrders = useMemo(
    () => orderStore.list().filter(o => o.partnerId === partnerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [ver, partnerId]
  );
  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const eligibleProjects = projects.filter(p =>
    ["执行中", "待结算", "已结算"].includes(p.status)
  );

  function reload() { setVer(v => v + 1); ctx.refresh(); }

  const [formOpen, setFormOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalAmount = allOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCommission = allOrders.reduce((s, o) => s + o.totalCommission, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">订单</h2>
          {allOrders.length > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">
              共 {allOrders.length} 笔 · 销售 ¥{totalAmount.toLocaleString()} · 提成{" "}
              <span className="text-green-600 font-medium">¥{totalCommission.toLocaleString()}</span>
            </p>
          )}
        </div>
        {eligibleProjects.length > 0 && (
          <Btn onClick={() => setFormOpen(true)}>
            <span className="flex items-center gap-1.5"><Plus size={14} />新建订单</span>
          </Btn>
        )}
      </div>

      {allOrders.length === 0 && <EmptyState text="暂无订单，活动执行中可新建" />}

      <div className="space-y-3">
        {allOrders.map(o => (
          <PartnerOrderCard
            key={o.id}
            order={o}
            project={projectMap.get(o.projectId) ?? null}
            expanded={expanded === o.id}
            onToggle={() => setExpanded(expanded === o.id ? null : o.id)}
            onDelete={() => {
              if (confirm("确认删除该订单？")) { orderStore.delete(o.id); reload(); }
            }}
          />
        ))}
      </div>

      {formOpen && (
        <NewOrderModal
          partnerId={partnerId}
          projects={eligibleProjects}
          onClose={() => setFormOpen(false)}
          onDone={() => { setFormOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

function PartnerOrderCard({ order: o, project, expanded, onToggle, onDelete }: {
  order: Order; project: Project | null;
  expanded: boolean; onToggle: () => void; onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
            <Package size={14} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{o.customerName}</p>
            <p className="text-xs text-gray-400">
              {o.customerPhone}
              {project && <span> · {project.title}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">¥{o.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-green-600">提成 ¥{o.totalCommission.toLocaleString()}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIP_COLOR[o.shippingStatus]}`}>
            {o.shippingStatus}
          </span>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {project && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">所属项目</p>
                <p className="text-gray-700">{project.title}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">收款方</p>
              <p className="text-gray-700">{o.paymentSide}</p>
            </div>
            {o.customerAddress && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">收货地址</p>
                <p className="text-gray-700">{o.customerAddress}</p>
              </div>
            )}
            {o.trackingNumber && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">快递单号</p>
                <p className="text-gray-700 font-mono text-xs">{o.trackingNumber}</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg overflow-hidden">
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

          <div className="flex items-center justify-between">
            {o.shippingStatus !== "已签收" && (
              <button onClick={onDelete}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                <Trash2 size={12} />删除订单
              </button>
            )}
            <p className="text-xs text-gray-400 ml-auto">
              {new Date(o.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function NewOrderModal({ partnerId, projects, onClose, onDone }: {
  partnerId: string; projects: Project[];
  onClose: () => void; onDone: () => void;
}) {
  const products = useMemo(() => productStore.list(), []);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", customerAddress: "",
    paymentSide: "公司收款" as "公司收款" | "琴行收款",
    notes: "",
  });
  const [items, setItems] = useState<{ productId: string; qty: number; unitPrice: string }[]>([]);
  const [err, setErr] = useState("");

  function addItem() { setItems(p => [...p, { productId: "", qty: 1, unitPrice: "" }]); }
  function updateItem(i: number, key: string, val: string | number) {
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  }
  function removeItem(i: number) { setItems(p => p.filter((_, idx) => idx !== i)); }

  const computed = items.map(row => {
    const prod = products.find(p => p.id === row.productId);
    const qty = row.qty || 1;
    const unitPrice = parseFloat(row.unitPrice) || (prod?.price ?? 0);
    let commissionAmount = 0;
    if (prod) {
      commissionAmount = prod.commissionType === "percent"
        ? unitPrice * qty * prod.commissionValue / 100
        : prod.commissionValue * qty;
    }
    return {
      productId: row.productId,
      productName: prod?.name ?? "未知产品",
      qty, unitPrice,
      commissionType: (prod?.commissionType ?? "fixed") as "percent" | "fixed",
      commissionValue: prod?.commissionValue ?? 0,
      commissionAmount,
    };
  });

  const totalAmount = computed.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const totalCommission = computed.reduce((s, i) => s + i.commissionAmount, 0);

  function submit() {
    if (!selectedProjectId) { setErr("请选择所属项目"); return; }
    if (!form.customerName || !form.customerPhone) { setErr("客户姓名和电话为必填"); return; }
    if (items.length === 0) { setErr("请至少添加一件产品"); return; }
    if (items.some(i => !i.productId)) { setErr("请选择所有产品"); return; }
    orderStore.create({
      projectId: selectedProjectId,
      partnerId,
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
        <Field label="所属项目" required>
          <select className={inp} value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}（{p.status}）</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="客户姓名" required>
            <input className={inp} value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
          </Field>
          <Field label="联系电话" required>
            <input className={inp} value={form.customerPhone} inputMode="numeric"
              onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
          </Field>
        </div>
        <Field label="收货地址">
          <input className={inp} value={form.customerAddress} placeholder="省市区详细地址"
            onChange={e => setForm(f => ({ ...f, customerAddress: e.target.value }))} />
        </Field>
        <Field label="收款方">
          <div className="flex gap-4">
            {(["公司收款", "琴行收款"] as const).map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.paymentSide === v}
                  onChange={() => setForm(f => ({ ...f, paymentSide: v }))} />
                <span className="text-sm text-gray-700">{v}</span>
              </label>
            ))}
          </div>
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              产品明细 <span className="text-red-400">*</span>
            </label>
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
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}（{p.model}）</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-16">
                    <input type="number" className={inp} value={item.qty} min={1}
                      onChange={e => updateItem(i, "qty", parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="w-24">
                    <input type="number" className={inp} value={item.unitPrice}
                      onChange={e => updateItem(i, "unitPrice", e.target.value)}
                      placeholder={prod ? prod.price.toString() : "单价"} />
                  </div>
                  <button onClick={() => removeItem(i)}
                    className="p-2 text-gray-300 hover:text-red-400 mt-0.5 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          {items.length > 0 && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 flex justify-between text-sm">
              <span className="text-gray-500">
                合计销售额 <strong className="text-gray-800">¥{totalAmount.toFixed(0)}</strong>
              </span>
              <span className="text-gray-500">
                合计提成 <strong className="text-green-600">¥{totalCommission.toFixed(0)}</strong>
              </span>
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
