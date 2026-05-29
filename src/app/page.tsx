"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Music, Building2, Store, ChevronRight, AlertCircle, Eye, EyeOff } from "lucide-react";

const COMPANY_PWD = process.env.NEXT_PUBLIC_COMPANY_PASSWORD ?? "123456";
const STORAGE_KEY = "ops_company_auth";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<null | "company">(null);
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  function enterCompany() {
    if (pwd !== COMPANY_PWD) { setErr("密码错误"); return; }
    localStorage.setItem(STORAGE_KEY, "1");
    router.push("/ops");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">音乐密码</h1>
          <p className="text-indigo-200 mt-1">线下运营管理平台</p>
        </div>

        {mode === null && (
          <div className="space-y-4">
            <p className="text-center text-indigo-200 text-sm mb-6">请选择登录身份</p>

            {/* 公司管理端 */}
            <button
              onClick={() => setMode("company")}
              className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 hover:bg-indigo-50 active:scale-[0.98] transition-all shadow-lg group">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                <Building2 size={22} className="text-indigo-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900">公司管理端</p>
                <p className="text-sm text-gray-400 mt-0.5">内部运营人员使用</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
            </button>

            {/* 琴行合作伙伴 */}
            <button
              onClick={() => router.push("/partner")}
              className="w-full bg-white/10 border border-white/20 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/20 active:scale-[0.98] transition-all group">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                <Store size={22} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">琴行合作伙伴</p>
                <p className="text-sm text-indigo-200 mt-0.5">合作琴行/机构使用</p>
              </div>
              <ChevronRight size={18} className="text-white/40 group-hover:text-white/80 transition-colors" />
            </button>
          </div>
        )}

        {mode === "company" && (
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Building2 size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">公司管理端</p>
                <p className="text-xs text-gray-400">请输入访问密码</p>
              </div>
            </div>

            {err && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{err}</p>
              </div>
            )}

            <div className="relative mb-4">
              <input
                type={show ? "text" : "password"}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-10"
                placeholder="请输入密码"
                value={pwd}
                onChange={e => { setPwd(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && enterCompany()}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={enterCompany}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all">
                进入管理端
              </button>
              <button
                onClick={() => { setMode(null); setPwd(""); setErr(""); }}
                className="px-4 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                返回
              </button>
            </div>
          </div>
        )}

        <p className="text-indigo-300/60 text-xs text-center mt-8">音乐密码线下运营平台 · 内部系统</p>
      </div>
    </div>
  );
}
