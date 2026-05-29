"use client";
import { useState, useRef } from "react";
import { Project, Settlement } from "@/lib/ops/types";
import { orderStore, settlementStore, compressImage } from "@/lib/ops/store";
import { inp, Field, Btn } from "./ui";
import { CheckCircle2, Upload, Wallet } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════
// 结算金额计算（项目详情 Tab，仅公司可见）
// ════════════════════════════════════════════════════════════════════════
export default function SettlementTab({ project, isCompany, onSettle }: {
  project: Project; isCompany: boolean; onSettle: () => void;
}) {
  const orders = orderStore.byProject(project.id);
  const totalCommission = orders.reduce((s, o) => s + o.totalCommission, 0);
  const existing = settlementStore.byProject(project.id);

  const [laborFee, setLaborFee] = useState(existing?.laborFee?.toString() ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [voucher, setVoucher] = useState<string | null>(existing?.voucherDataUrl ?? null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const voucherRef = useRef<HTMLInputElement>(null);

  const labor = parseFloat(laborFee) || 0;
  const totalPayout = labor + totalCommission;
  const isSettled = project.status === "已结算";

  async function uploadVoucher(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const item = await compressImage(files[0], 1200, 0.8);
    setVoucher(item.dataUrl);
    setUploading(false);
  }

  function save() {
    settlementStore.upsert(project.id, {
      projectId: project.id,
      laborFee: labor,
      totalCommission,
      totalPayout,
      paidAt: isSettled ? (existing?.paidAt ?? new Date().toISOString()) : null,
      voucherDataUrl: voucher,
      notes,
    });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* 汇总卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <SumCard label="订单提成合计" value={totalCommission} color="text-green-600" sub={`${orders.length} 笔订单`} />
        <SumCard label="劳务费" value={labor} color="text-blue-600" sub="手动填写" />
        <SumCard label="应打款合计" value={totalPayout} color="text-indigo-600" bold />
      </div>

      {!isSettled && isCompany && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">填写结算信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="劳务费（元）">
              <input type="number" className={inp} value={laborFee} min="0"
                onChange={e => setLaborFee(e.target.value)} placeholder="0" />
            </Field>
            <Field label="打款凭证（可选）">
              <div className="flex gap-2">
                <button onClick={() => voucherRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-50">
                  <Upload size={14} />{voucher ? "重新上传" : "上传凭证"}
                </button>
                {uploading && <span className="text-xs text-gray-400 self-center">处理中…</span>}
                <input ref={voucherRef} type="file" accept="image/*" className="hidden" onChange={e => uploadVoucher(e.target.files)} />
              </div>
              {voucher && (
                <a href={voucher} target="_blank" rel="noreferrer" className="block mt-2 text-xs text-indigo-500 hover:underline">
                  查看已上传凭证 ↗
                </a>
              )}
            </Field>
          </div>
          <Field label="备注">
            <textarea className={inp + " resize-none"} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </Field>
          <div className="flex gap-3">
            <Btn onClick={save}>{saved ? "已保存 ✓" : "保存结算信息"}</Btn>
          </div>
        </div>
      )}

      {/* 已结算状态 */}
      {isSettled && existing && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">已完成结算</p>
            <p className="text-sm text-green-700 mt-1">
              劳务费 ¥{existing.laborFee.toLocaleString()} + 提成 ¥{existing.totalCommission.toLocaleString()} = 打款 ¥{existing.totalPayout.toLocaleString()}
            </p>
            {existing.notes && <p className="text-xs text-green-600 mt-1">{existing.notes}</p>}
            {existing.voucherDataUrl && (
              <a href={existing.voucherDataUrl} target="_blank" rel="noreferrer" className="text-xs text-green-700 hover:underline mt-1 block">
                查看打款凭证 ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* 订单提成明细 */}
      {orders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">订单提成明细</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">客户</th>
                <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">销售额</th>
                <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">提成</th>
                <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">物流</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="px-4 py-2.5 text-gray-700">{o.customerName}</td>
                  <td className="px-4 py-2.5 text-gray-700 text-right">¥{o.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-green-600 text-right font-medium">¥{o.totalCommission.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${o.shippingStatus === "已签收" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {o.shippingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SumCard({ label, value, color, sub, bold }: {
  label: string; value: number; color: string; sub?: string; bold?: boolean;
}) {
  return (
    <div className={`rounded-xl border shadow-sm p-4 ${bold ? "bg-indigo-50 border-indigo-100" : "bg-white border-gray-100"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={14} className={color} />
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>¥{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
