"use client";
import { useMemo, useState } from "react";
import { Ctx } from "@/app/ops/page";
import { partnerStore, projectStore } from "@/lib/ops/store";
import { inp, Field, Btn, RegionSelect, StatusBadge, EmptyState } from "./ui";
import { ArrowLeft, ChevronRight, Phone, MessageCircle, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

// ── 公司端：琴行列表 ────────────────────────────────────────────────────
export function PartnersView({ ctx }: { ctx: Ctx }) {
  const partners = useMemo(() => partnerStore.list(), []);
  const projects = useMemo(() => projectStore.list(), []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">用户档案</h2>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {partners.length === 0 && <div className="col-span-3"><EmptyState text="暂无琴行" /></div>}
        {partners.map(p => {
          const count = projects.filter(pr => pr.partnerId === p.id).length;
          const hasPayment = !!p.bankCard || !!p.alipay;
          return (
            <button key={p.id} onClick={() => ctx.go("partner-detail", p.id)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all text-left">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{p.storeName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{p.contactName}</p>
                </div>
                <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{count} 个活动</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <p className="flex items-center gap-1.5"><MapPin size={12} />{p.province}{p.city}{p.district || ""}</p>
                <p className="flex items-center gap-1.5"><Phone size={12} />{p.phone}</p>
              </div>
              <p className={`text-xs mt-3 flex items-center gap-1 ${hasPayment ? "text-green-500" : "text-amber-500"}`}>
                {hasPayment ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {hasPayment ? "打款信息已填" : "打款信息待补充"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 公司端：琴行详情 ────────────────────────────────────────────────────
export function PartnerDetailView({ ctx }: { ctx: Ctx }) {
  const p = partnerStore.get(ctx.selectedId);
  const projects = useMemo(() => p ? projectStore.byPartner(p.id) : [], [p]);
  if (!p) return <EmptyState text="未找到该琴行" />;

  return (
    <div className="p-6 max-w-3xl">
      <Breadcrumb back="用户档案" current={p.storeName} onBack={() => ctx.go("partners")} />
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3 text-sm">
          <h3 className="font-semibold text-gray-800">基本信息</h3>
          <Row label="负责人" value={p.contactName} />
          <Row label="琴行名称" value={p.storeName} />
          <Row label="地区" value={`${p.province}${p.city}${p.district || ""}`} />
          <Row label="电话" value={p.phone} />
          <Row label="微信" value={p.wechat || "—"} />
          <div className="border-t border-gray-50 pt-3 mt-3">
            <h3 className="font-semibold text-gray-800 mb-2">打款信息</h3>
            <Row label="收款人" value={p.payeeName || "—"} />
            <Row label="银行卡号" value={p.bankCard || "—"} />
            <Row label="开户行" value={p.bankName || "—"} />
            <Row label="支付宝" value={p.alipay || "—"} />
          </div>
        </div>
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">该琴行活动</h3>
          <div className="space-y-2">
            {projects.length === 0 && <EmptyState text="暂无活动" />}
            {projects.map(pr => (
              <button key={pr.id} onClick={() => ctx.go("project-detail", pr.id)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 text-left">
                <div>
                  <p className="text-sm text-gray-800">{pr.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pr.city} · {pr.eventDate || "日期待定"}</p>
                </div>
                <StatusBadge status={pr.status} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 琴行端：我的档案 ────────────────────────────────────────────────────
export function MyProfileView({ ctx }: { ctx: Ctx }) {
  const p = partnerStore.get(ctx.session.partnerId);
  const [form, setForm] = useState(() => ({
    contactName: p?.contactName ?? "", storeName: p?.storeName ?? "",
    province: p?.province ?? "", city: p?.city ?? "", district: p?.district ?? "",
    phone: p?.phone ?? "", wechat: p?.wechat ?? "",
    payeeName: p?.payeeName ?? "", bankCard: p?.bankCard ?? "", bankName: p?.bankName ?? "", alipay: p?.alipay ?? "",
  }));
  const [saved, setSaved] = useState(false);
  if (!p) return <EmptyState text="未找到档案" />;
  function s(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function save() {
    partnerStore.update(p!.id, {
      contactName: form.contactName, storeName: form.storeName,
      province: form.province, city: form.city, district: form.district,
      phone: form.phone, wechat: form.wechat || null,
      payeeName: form.payeeName || null, bankCard: form.bankCard || null,
      bankName: form.bankName || null, alipay: form.alipay || null,
    });
    ctx.refresh(); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">我的档案</h2>
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">基本信息</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="负责人姓名"><input className={inp} value={form.contactName} onChange={e => s("contactName", e.target.value)} /></Field>
            <Field label="琴行名称"><input className={inp} value={form.storeName} onChange={e => s("storeName", e.target.value)} /></Field>
          </div>
          <Field label="所在地区">
            <RegionSelect province={form.province} city={form.city} district={form.district}
              onChange={(v) => setForm(f => ({ ...f, ...v }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="电话"><input className={inp} value={form.phone} onChange={e => s("phone", e.target.value)} /></Field>
            <Field label="微信"><input className={inp} value={form.wechat} onChange={e => s("wechat", e.target.value)} /></Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">打款信息</h3>
          <p className="text-xs text-gray-400">用于活动结算后公司向您打款，请确保准确。</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="收款人姓名"><input className={inp} value={form.payeeName} onChange={e => s("payeeName", e.target.value)} /></Field>
            <Field label="开户行"><input className={inp} value={form.bankName} onChange={e => s("bankName", e.target.value)} placeholder="例：工商银行XX支行" /></Field>
          </div>
          <Field label="银行卡号"><input className={inp} value={form.bankCard} onChange={e => s("bankCard", e.target.value)} placeholder="收款银行卡号" /></Field>
          <Field label="支付宝账号（可选）"><input className={inp} value={form.alipay} onChange={e => s("alipay", e.target.value)} /></Field>
        </div>

        <Btn onClick={save}>{saved ? "已保存 ✓" : "保存档案"}</Btn>
      </div>
    </div>
  );
}

// ── 小组件 ──────────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-700 text-right break-all">{value}</span>
    </div>
  );
}

export function Breadcrumb({ back, current, onBack }: { back: string; current: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
      <button onClick={onBack} className="hover:text-gray-600 flex items-center gap-1"><ArrowLeft size={14} />{back}</button>
      <ChevronRight size={12} />
      <span className="text-gray-700">{current}</span>
    </div>
  );
}
