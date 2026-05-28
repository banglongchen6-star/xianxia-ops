import { createClient } from "@/lib/supabase/server";
import ProjectForm from "@/components/project/ProjectForm";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, company")
    .order("name");

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">新建项目</h2>
      <ProjectForm clients={clients || []} />
    </div>
  );
}
