"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PortalHeader({ clientName }: { clientName: string }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">你好，{clientName}</h1>
        <p className="text-sm text-gray-400 mt-0.5">以下是音乐密码为您准备的项目资料</p>
      </div>
      <button
        onClick={logout}
        className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 border border-gray-200 rounded-lg"
      >
        退出
      </button>
    </div>
  );
}
