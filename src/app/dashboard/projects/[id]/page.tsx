import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProjectDetail from "@/components/project/ProjectDetail";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(*)")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const { data: files } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const { data: followUps } = await supabase
    .from("follow_ups")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/dashboard/projects" className="hover:text-gray-600">项目中心</Link>
        <span>/</span>
        <span className="text-gray-700">{project.name}</span>
      </div>
      <ProjectDetail
        project={project}
        files={files || []}
        followUps={followUps || []}
        userId={user?.id ?? ""}
      />
    </div>
  );
}
