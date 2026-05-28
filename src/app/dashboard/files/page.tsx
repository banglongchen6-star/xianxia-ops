import { createClient } from "@/lib/supabase/server";
import FileList from "@/components/file/FileList";

export default async function FilesPage() {
  const supabase = await createClient();
  const { data: files } = await supabase
    .from("project_files")
    .select("*, projects(name, clients(name, company))")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">文件中心</h2>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        {files && files.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(
              files.reduce((acc: any, f: any) => {
                const key = f.projects?.name ?? "未分类";
                if (!acc[key]) acc[key] = [];
                acc[key].push(f);
                return acc;
              }, {})
            ).map(([projectName, projectFiles]) => (
              <div key={projectName}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {projectName}
                </h3>
                <FileList files={projectFiles as any} isAdmin={true} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            暂无文件，在项目详情页上传
          </p>
        )}
      </div>
    </div>
  );
}
