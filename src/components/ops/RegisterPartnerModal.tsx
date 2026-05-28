"use client";
import { useState } from "react";
import { Modal, Field, inp, RegionSelect, Btn } from "./ui";
import { partnerStore } from "@/lib/ops/store";

export default function RegisterPartnerModal({ onClose, onDone }: {
  onClose: () => void; onDone: (id: string) => void;
}) {
  const [form, setForm] = useState({
    contactName: "", storeName: "", province: "", city: "", district: "", phone: "", wechat: "",
  });
  const [err, setErr] = useState("");
  function s(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.contactName || !form.storeName || !form.phone) { setErr("负责人、琴行名称、电话为必填"); return; }
    const p = partnerStore.create({
      contactName: form.contactName, storeName: form.storeName,
      province: form.province, city: form.city, district: form.district,
      phone: form.phone, wechat: form.wechat || null,
      payeeName: null, bankCard: null, bankName: null, alipay: null,
    });
    onDone(p.id);
  }

  return (
    <Modal title="注册新琴行" onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        <Field label="负责人姓名" required>
          <input className={inp} value={form.contactName} onChange={e => s("contactName", e.target.value)} placeholder="您的姓名" />
        </Field>
        <Field label="琴行/机构名称" required>
          <input className={inp} value={form.storeName} onChange={e => s("storeName", e.target.value)} placeholder="例：悦音琴行" />
        </Field>
        <Field label="所在地区">
          <RegionSelect province={form.province} city={form.city} district={form.district}
            onChange={(v) => setForm(f => ({ ...f, ...v }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="电话" required>
            <input className={inp} value={form.phone} onChange={e => s("phone", e.target.value)} placeholder="手机号" />
          </Field>
          <Field label="微信">
            <input className={inp} value={form.wechat} onChange={e => s("wechat", e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-gray-400">打款信息（收款账号）注册后可在「我的档案」里自行填写。</p>
        <div className="flex gap-3 pt-1">
          <Btn onClick={submit}>注册并进入</Btn>
          <Btn variant="outline" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </Modal>
  );
}
