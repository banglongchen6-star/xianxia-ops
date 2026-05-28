import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ClientEditForm from "@/components/client/ClientEditForm";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, type, event_date")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/dashboard/clients" className="hover:text-gray-600">客户管理</Link>
        <span>/</span>
        <span className="text-gray-700">{client.name}</span>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
          <ClientEditForm client={client} />
        </div>
        <div className="col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">关联项目</h3>
            <div className="space-y-2">
              {(projects || []).map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projects/${p.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <div>
                    <p className="text-sm text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.type}</p>
                  </div>
                  <span className="text-xs text-gray-500">{p.status}</span>
                </Link>
              ))}
              {(!projects || projects.length === 0) && (
                <p className="text-xs text-gray-300">暂无关联项目</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
