"use client";
import { useMemo, useState } from "react";
import { Ctx } from "@/app/ops/page";
import { productStore } from "@/lib/ops/store";
import { Product, CommissionType } from "@/lib/ops/types";
import { inp, Field, Btn, Modal, EmptyState } from "./ui";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════
// 产品&提成管理
// ════════════════════════════════════════════════════════════════════════
export default function ProductsView({ ctx }: { ctx: Ctx }) {
  const isCompany = ctx.session.role === "company";
  const [products, setProducts] = useState(() => productStore.list());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  function reload() { setProducts(productStore.list()); ctx.refresh(); }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">产品&提成</h2>
        {isCompany && (
          <Btn onClick={() => { setEditing(null); setFormOpen(true); }}>
            <span className="flex items-center gap-1.5"><Plus size={14} />新增产品</span>
          </Btn>
        )}
      </div>

      {products.length === 0 && <EmptyState text="暂无产品，请先添加" />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map(p => (
          <ProductCard key={p.id} product={p} isCompany={isCompany}
            onEdit={() => { setEditing(p); setFormOpen(true); }}
            onDelete={() => {
              if (confirm(`确认删除「${p.name}」？`)) {
                productStore.delete(p.id); reload();
              }
            }}
          />
        ))}
      </div>

      {formOpen && (
        <ProductFormModal
          product={editing}
          onClose={() => setFormOpen(false)}
          onDone={() => { setFormOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

function ProductCard({ product: p, isCompany, onEdit, onDelete }: {
  product: Product; isCompany: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const commission = p.commissionType === "percent"
    ? `销售额 ${p.commissionValue}%`
    : `固定 ¥${p.commissionValue}`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
            <Package size={16} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{p.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{p.model}</p>
          </div>
        </div>
        {isCompany && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">建议售价</span>
          <span className="text-gray-800 font-medium">¥{p.price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">提成方式</span>
          <span className="text-green-600 font-medium">{commission}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">库存</span>
          <span className={p.stock <= 5 ? "text-red-500" : "text-gray-700"}>{p.stock} 件</span>
        </div>
      </div>

      {p.description && (
        <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-2">{p.description}</p>
      )}
    </div>
  );
}

// ── 产品表单 ────────────────────────────────────────────────────────────
function ProductFormModal({ product, onClose, onDone }: {
  product: Product | null; onClose: () => void; onDone: () => void;
}) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    model: product?.model ?? "",
    price: product?.price?.toString() ?? "",
    commissionType: (product?.commissionType ?? "percent") as CommissionType,
    commissionValue: product?.commissionValue?.toString() ?? "",
    description: product?.description ?? "",
    stock: product?.stock?.toString() ?? "999",
  });
  const [err, setErr] = useState("");

  function s(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.name || !form.model || !form.price || !form.commissionValue) {
      setErr("产品名称、型号、售价、提成均为必填"); return;
    }
    const price = parseFloat(form.price);
    const commissionValue = parseFloat(form.commissionValue);
    const stock = parseInt(form.stock) || 0;
    if (isNaN(price) || isNaN(commissionValue)) { setErr("价格格式不正确"); return; }
    if (form.commissionType === "percent" && (commissionValue < 0 || commissionValue > 100)) {
      setErr("比例提成应在 0-100 之间"); return;
    }

    const data = {
      name: form.name, model: form.model, price, commissionType: form.commissionType,
      commissionValue, description: form.description, stock,
    };
    if (product) {
      productStore.update(product.id, data);
    } else {
      productStore.create(data);
    }
    onDone();
  }

  return (
    <Modal title={product ? "编辑产品" : "新增产品"} onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="产品名称" required>
            <input className={inp} value={form.name} onChange={e => s("name", e.target.value)} />
          </Field>
          <Field label="型号" required>
            <input className={inp} value={form.model} onChange={e => s("model", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="建议售价（元）" required>
            <input type="number" className={inp} value={form.price} onChange={e => s("price", e.target.value)} placeholder="0.00" min="0" />
          </Field>
          <Field label="库存数量">
            <input type="number" className={inp} value={form.stock} onChange={e => s("stock", e.target.value)} min="0" />
          </Field>
        </div>
        <Field label="提成方式" required>
          <div className="flex gap-3">
            {([["percent", "比例提成（%）"], ["fixed", "固定提成（元/件）"]] as const).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.commissionType === val}
                  onChange={() => setForm(f => ({ ...f, commissionType: val, commissionValue: "" }))} />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label={form.commissionType === "percent" ? "提成比例（%）" : "固定提成金额（元）"} required>
          <input type="number" className={inp} value={form.commissionValue} onChange={e => s("commissionValue", e.target.value)}
            placeholder={form.commissionType === "percent" ? "例：15" : "例：500"} min="0"
            max={form.commissionType === "percent" ? "100" : undefined} />
        </Field>
        <Field label="产品描述">
          <textarea className={inp + " resize-none"} rows={2} value={form.description} onChange={e => s("description", e.target.value)} />
        </Field>
        <div className="flex gap-3 pt-1">
          <Btn onClick={submit}>{product ? "保存" : "创建"}</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}
