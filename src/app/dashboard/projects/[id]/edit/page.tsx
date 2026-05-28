import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProjectForm from "@/components/project/ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: clients }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("clients").select("id, name, company").order("name"),
  ]);

  if (!project) notFound();

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href={`/dashboard/projects/${id}`} className="hover:text-gray-600">返回项目</Link>
        <span>/</span>
        <span className="text-gray-700">编辑</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">编辑项目</h2>
      <ProjectForm clients={clients || []} project={project} />
    </div>
  );
}
