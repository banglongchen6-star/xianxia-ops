"use client";
import { X } from "lucide-react";
import { ProjectStatus } from "@/lib/ops/types";
import { provinces, cities, districts } from "@/lib/regions";

export const inp =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";

export const STATUS_COLOR: Record<ProjectStatus, string> = {
  草稿: "bg-gray-100 text-gray-600",
  执行中: "bg-blue-100 text-blue-700",
  待结算: "bg-purple-100 text-purple-700",
  已结算: "bg-green-100 text-green-700",
  已取消: "bg-gray-100 text-gray-400",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>
      {status}
    </span>
  );
}

export function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-400"> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// 省市区三级联动
export function RegionSelect({ province, city, district, onChange }: {
  province: string; city: string; district: string;
  onChange: (v: { province: string; city: string; district: string }) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <select className={inp} value={province}
        onChange={(e) => onChange({ province: e.target.value, city: "", district: "" })}>
        <option value="">省</option>
        {provinces().map(p => <option key={p}>{p}</option>)}
      </select>
      <select className={inp} value={city} disabled={!province}
        onChange={(e) => onChange({ province, city: e.target.value, district: "" })}>
        <option value="">市</option>
        {cities(province).map(c => <option key={c}>{c}</option>)}
      </select>
      <select className={inp} value={district} disabled={!city}
        onChange={(e) => onChange({ province, city, district: e.target.value })}>
        <option value="">区</option>
        {districts(province, city).map(d => <option key={d}>{d}</option>)}
      </select>
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", disabled, type = "button", className = "" }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "outline"; disabled?: boolean;
  type?: "button" | "submit"; className?: string;
}) {
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    ghost: "text-gray-500 hover:bg-gray-100",
    danger: "text-red-500 border border-red-100 hover:bg-red-50",
    outline: "border border-gray-200 text-gray-700 hover:bg-gray-50",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-300 text-center py-10">{text}</p>;
}
