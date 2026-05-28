"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Users, FolderOpen, FileText, LogOut,
  Download, Eye, EyeOff, Trash2, Upload, Plus, X, ArrowLeft, ChevronRight
} from "lucide-react";
import { clientStore, projectStore, fileStore, followUpStore, LocalFile } from "@/lib/store";
import { Client, Project, FollowUp, ProjectStatus, ProjectType, FileCategory } from "@/lib/types";

// ── constants ──────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  线索: "bg-gray-100 text-gray-600", 跟进中: "bg-blue-100 text-blue-700",
  签约: "bg-purple-100 text-purple-700", 执行中: "bg-yellow-100 text-yellow-700",
  已完成: "bg-green-100 text-green-700", 已取消: "bg-red-100 text-red-600",
};
const CAT_COLOR: Record<string, string> = {
  物料: "bg-blue-50 text-blue-600", 合同: "bg-purple-50 text-purple-600",
  报价单: "bg-yellow-50 text-yellow-700", 宣传资料: "bg-green-50 text-green-600", 其他: "bg-gray-50 text-gray-500",
};
const STATUSES: ProjectStatus[] = ["线索", "跟进中", "签约", "执行中", "已完成", "已取消"];
const TYPES: ProjectType[] = ["体验课活动", "商务合作", "演出展览"];
const CATS: FileCategory[] = ["物料", "合同", "报价单", "宣传资料", "其他"];

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("zh-CN");
}
function fmtSize(b: number | null) {
  if (!b) return "";
  if (b < 1024) return b + "B";
  if (b < 1048576) return (b / 1024).toFixed(1) + "KB";
  return (b / 1048576).toFixed(1) + "MB";
}
function fmtTime(s: string) {
  const d = new Date(s);
  return d.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Modal wrapper ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Field helpers ──────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";

// ── Nav ────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "board", icon: LayoutDashboard, label: "进度看板" },
  { id: "projects", icon: FolderOpen, label: "项目中心" },
  { id: "clients", icon: Users, label: "客户管理" },
  { id: "files", icon: FileText, label: "文件中心" },
];

// ══════════════════════════════════════════════════════════════════════════
export default function DemoPage() {
  const [page, setPage] = useState("board");
  const [portalMode, setPortalMode] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [selProjectId, setSelProjectId] = useState<string | null>(null);
  const [selClientId, setSelClientId] = useState<string | null>(null);
  const [modal, setModal] = useState<"new-project" | "new-client" | null>(null);

  const reload = useCallback(() => {
    setProjects(projectStore.list());
    setClients(clientStore.list());
    setFiles(fileStore.list());
    setFollowUps(followUpStore.list());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const selProject = projects.find(p => p.id === selProjectId) ?? null;
  const selClient = clients.find(c => c.id === selClientId) ?? null;

  function navTo(p: string) { setPage(p); setSelProjectId(null); setSelClientId(null); }
  function openProject(id: string) { setSelProjectId(id); setPage("project-detail"); }
  function openClient(id: string) { setSelClientId(id); setPage("client-detail"); }

  // Portal view ──────────────────────────────────────────────────────────
  if (portalMode) {
    const clientProjects = projects.slice(0, 2); // 模拟客户视角
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-gray-900">你好，合作方</h1>
              <p className="text-sm text-gray-400 mt-0.5">以下是音乐密码为您准备的项目资料</p>
            </div>
            <button onClick={() => setPortalMode(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg bg-white">
              切换内部视图
            </button>
          </div>
          {clientProjects.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
              暂无项目，运营人员创建后会通知您
            </div>
          )}
          {clientProjects.map(p => {
            const pFiles = files.filter(f => f.project_id === p.id && f.is_client_visible);
            const client = clients.find(c => c.id === p.client_id);
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{p.type}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[p.status]}`}>{p.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[["活动地点", p.venue || "待确认"], ["活动日期", p.event_date ? fmtDate(p.event_date) : "待确认"], ["可下载文件", pFiles.length + " 个"]].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">{k}</p>
                      <p className="text-gray-700 mt-0.5 font-medium text-sm">{v}</p>
                    </div>
                  ))}
                </div>
                {p.notes && <div className="bg-indigo-50 rounded-lg px-4 py-3 mb-4 text-sm text-indigo-700">{p.notes}</div>}
                <h4 className="text-xs font-medium text-gray-500 mb-2">可下载资料</h4>
                {pFiles.length === 0
                  ? <p className="text-xs text-gray-300">暂无文件</p>
                  : pFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-1.5">
                      <FileText size={15} className="text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{f.name}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${CAT_COLOR[f.category]}`}>{f.category}</span>
                          {f.size && <span className="text-xs text-gray-400">{fmtSize(f.size)}</span>}
                        </div>
                      </div>
                      <a href={f.dataUrl} download={f.name} className="p-1.5 text-gray-400 hover:text-indigo-600">
                        <Download size={14} />
                      </a>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Main layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-700">
          <h1 className="text-sm font-bold text-white">线下运营管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">音乐密码</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => navTo(id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors ${page.startsWith(id) || (id === "projects" && page === "project-detail") || (id === "clients" && page === "client-detail") ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-700 space-y-1">
          <button onClick={() => setPortalMode(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-300 hover:bg-gray-800 w-full">
            <Users size={16} />客户视角预览
          </button>
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500">
            <LogOut size={16} />退出登录
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-gray-50">

        {/* ── BOARD ── */}
        {page === "board" && (
          <BoardView projects={projects} clients={clients}
            onOpen={openProject}
            onNew={() => setModal("new-project")} />
        )}

        {/* ── PROJECTS LIST ── */}
        {page === "projects" && (
          <ProjectsView projects={projects} clients={clients}
            onOpen={openProject}
            onNew={() => setModal("new-project")} />
        )}

        {/* ── PROJECT DETAIL ── */}
        {page === "project-detail" && selProject && (
          <ProjectDetailView
            project={selProject}
            client={clients.find(c => c.id === selProject.client_id) ?? null}
            files={files.filter(f => f.project_id === selProject.id)}
            followUps={followUps.filter(f => f.project_id === selProject.id).sort((a, b) => b.created_at.localeCompare(a.created_at))}
            onBack={() => setPage("projects")}
            onChange={reload}
          />
        )}

        {/* ── CLIENTS ── */}
        {page === "clients" && (
          <ClientsView clients={clients} projects={projects}
            onOpen={openClient}
            onNew={() => setModal("new-client")} />
        )}

        {/* ── CLIENT DETAIL ── */}
        {page === "client-detail" && selClient && (
          <ClientDetailView
            client={selClient}
            projects={projects.filter(p => p.client_id === selClient.id)}
            onBack={() => setPage("clients")}
            onChange={reload}
            onOpenProject={openProject}
          />
        )}

        {/* ── FILES ── */}
        {page === "files" && (
          <FilesView files={files} projects={projects} onChange={reload} />
        )}
      </main>

      {/* ── MODALS ── */}
      {modal === "new-project" && (
        <NewProjectModal clients={clients} onClose={() => setModal(null)}
          onSave={(data) => { projectStore.create(data); reload(); setModal(null); }} />
      )}
      {modal === "new-client" && (
        <NewClientModal onClose={() => setModal(null)}
          onSave={(data) => { clientStore.create(data); reload(); setModal(null); }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// BOARD VIEW
// ══════════════════════════════════════════════════════════════════════════
function BoardView({ projects, clients, onOpen, onNew }: { projects: Project[]; clients: Client[]; onOpen: (id: string) => void; onNew: () => void }) {
  const grouped = STATUSES.reduce((a, s) => { a[s] = projects.filter(p => p.status === s); return a; }, {} as Record<string, Project[]>);
  const active = projects.filter(p => ["跟进中", "签约", "执行中"].includes(p.status)).length;
  const done = projects.filter(p => p.status === "已完成").length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">进度看板</h2>
        <button onClick={onNew} className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5">
          <Plus size={14} />新建项目
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[["全部项目", projects.length, "text-gray-900"], ["进行中", active, "text-indigo-600"], ["已完成", done, "text-green-600"]].map(([l, v, c]) => (
          <div key={l as string} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">{l}</p>
            <p className={`text-3xl font-bold mt-1 ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {(["线索", "跟进中", "执行中"] as ProjectStatus[]).map(s => (
          <KanbanCol key={s} status={s} items={grouped[s]} clients={clients} onOpen={onOpen} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {(["签约", "已完成", "已取消"] as ProjectStatus[]).map(s => (
          <KanbanCol key={s} status={s} items={grouped[s]} clients={clients} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function KanbanCol({ status, items, clients, onOpen }: { status: string; items: Project[]; clients: Client[]; onOpen: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>{status}</span>
        <span className="text-xs text-gray-400">{items.length} 个</span>
      </div>
      <div className="p-3 space-y-2 min-h-16">
        {items.map(p => {
          const c = clients.find(cl => cl.id === p.client_id);
          return (
            <button key={p.id} onClick={() => onOpen(p.id)}
              className="block w-full text-left bg-gray-50 rounded-lg p-3 hover:bg-indigo-50 transition-colors">
              <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c?.company || c?.name || "—"}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-400">{p.type}</span>
                {p.event_date && <span className="text-xs text-gray-400">{new Date(p.event_date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span>}
              </div>
            </button>
          );
        })}
        {items.length === 0 && <p className="text-xs text-gray-300 text-center py-3">暂无</p>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PROJECTS LIST
// ══════════════════════════════════════════════════════════════════════════
function ProjectsView({ projects, clients, onOpen, onNew }: { projects: Project[]; clients: Client[]; onOpen: (id: string) => void; onNew: () => void }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">项目中心</h2>
        <button onClick={onNew} className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5">
          <Plus size={14} />新建项目
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["项目名称", "客户", "类型", "状态", "活动日期", "更新时间"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {projects.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">暂无项目，点击右上角新建</td></tr>
            )}
            {[...projects].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map(p => {
              const c = clients.find(cl => cl.id === p.client_id);
              return (
                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onOpen(p.id)}>
                  <td className="px-4 py-3 text-indigo-600 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c?.company || c?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{p.type}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(p.event_date)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(p.updated_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PROJECT DETAIL
// ══════════════════════════════════════════════════════════════════════════
function ProjectDetailView({ project, client, files, followUps, onBack, onChange }: {
  project: Project; client: Client | null; files: LocalFile[]; followUps: FollowUp[];
  onBack: () => void; onChange: () => void;
}) {
  const [status, setStatus] = useState(project.status);
  const [followText, setFollowText] = useState("");
  const [fileCategory, setFileCategory] = useState<FileCategory>("物料");
  const [clientVisible, setClientVisible] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: project.name, venue: project.venue || "", event_date: project.event_date || "", notes: project.notes || "" });

  function changeStatus(s: string) {
    setStatus(s as ProjectStatus);
    projectStore.update(project.id, { status: s as ProjectStatus });
    onChange();
  }

  function addFollowUp() {
    if (!followText.trim()) return;
    followUpStore.add(project.id, followText);
    setFollowText("");
    onChange();
  }

  function saveEdit() {
    projectStore.update(project.id, { name: editForm.name, venue: editForm.venue || null, event_date: editForm.event_date || null, notes: editForm.notes || null });
    setEditing(false);
    onChange();
  }

  function handleFiles(list: FileList | null) {
    if (!list) return;
    Array.from(list).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileStore.add({ project_id: project.id, name: file.name, category: fileCategory, size: file.size, is_client_visible: clientVisible, dataUrl: e.target?.result as string });
        onChange();
      };
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <button onClick={onBack} className="hover:text-gray-600 flex items-center gap-1"><ArrowLeft size={14} />项目中心</button>
        <ChevronRight size={12} />
        <span className="text-gray-700">{project.name}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          {/* 基本信息 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {editing ? (
              <div className="space-y-3">
                <input className={inp} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="项目名称" />
                <input className={inp} value={editForm.venue} onChange={e => setEditForm(f => ({ ...f, venue: e.target.value }))} placeholder="活动地点" />
                <input type="date" className={inp} value={editForm.event_date} onChange={e => setEditForm(f => ({ ...f, event_date: e.target.value }))} />
                <textarea className={inp + " resize-none"} rows={2} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="备注" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700">保存</button>
                  <button onClick={() => setEditing(false)} className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">取消</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">{project.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={status} onChange={e => changeStatus(e.target.value)}
                      className={`text-xs font-medium px-3 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLOR[status]}`}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-200 rounded-lg">编辑</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div><p className="text-xs text-gray-400">客户</p><p className="text-gray-700 mt-0.5">{client?.company || client?.name || "—"}</p></div>
                  <div><p className="text-xs text-gray-400">地点</p><p className="text-gray-700 mt-0.5">{project.venue || "—"}</p></div>
                  <div><p className="text-xs text-gray-400">活动日期</p><p className="text-gray-700 mt-0.5">{fmtDate(project.event_date)}</p></div>
                </div>
                {project.notes && <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">{project.notes}</div>}
              </>
            )}
          </div>

          {/* 文件 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">文件资料</h3>
            <div className="border border-dashed border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <select value={fileCategory} onChange={e => setFileCategory(e.target.value as FileCategory)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={clientVisible} onChange={e => setClientVisible(e.target.checked)} className="rounded" />客户可见
                </label>
              </div>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
                <Upload size={14} />点击上传文件
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>
            <div className="space-y-2">
              {files.length === 0 && <p className="text-xs text-gray-300 py-1">暂无文件</p>}
              {files.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText size={15} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{f.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${CAT_COLOR[f.category]}`}>{f.category}</span>
                      {f.size && <span className="text-xs text-gray-400">{fmtSize(f.size)}</span>}
                      {!f.is_client_visible && <span className="text-xs text-gray-400">（仅内部）</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a href={f.dataUrl} download={f.name} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Download size={14} /></a>
                    <button onClick={() => { fileStore.toggleVisible(f.id); onChange(); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title={f.is_client_visible ? "对客户可见" : "对客户隐藏"}>
                      {f.is_client_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => { fileStore.delete(f.id); onChange(); }} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 跟进记录 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">跟进记录</h3>
            <div className="flex gap-2 mb-4">
              <textarea className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" rows={2}
                placeholder="记录跟进内容..." value={followText} onChange={e => setFollowText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) addFollowUp(); }} />
              <button onClick={addFollowUp} className="bg-indigo-600 text-white text-sm px-4 rounded-lg hover:bg-indigo-700">记录</button>
            </div>
            <div className="space-y-3">
              {followUps.length === 0 && <p className="text-xs text-gray-300">暂无跟进记录</p>}
              {followUps.map(f => (
                <div key={f.id} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{f.content}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtTime(f.created_at)}</p>
                  </div>
                  <button onClick={() => { followUpStore.delete(f.id); onChange(); }} className="text-gray-300 hover:text-red-400 mt-0.5"><X size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">联系人</h3>
            {client ? (
              <div className="space-y-2 text-sm">
                <div><p className="text-xs text-gray-400">姓名</p><p className="text-gray-700">{client.name}</p></div>
                {client.company && <div><p className="text-xs text-gray-400">公司</p><p className="text-gray-700">{client.company}</p></div>}
                {client.phone && <div><p className="text-xs text-gray-400">电话</p><a href={`tel:${client.phone}`} className="text-indigo-600">{client.phone}</a></div>}
                {client.wechat && <div><p className="text-xs text-gray-400">微信</p><p className="text-gray-700">{client.wechat}</p></div>}
              </div>
            ) : <p className="text-xs text-gray-400">未关联客户</p>}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">文件统计</h3>
            {CATS.slice(0, 4).map(cat => {
              const n = files.filter(f => f.category === cat).length;
              return (
                <div key={cat} className="flex justify-between items-center py-1.5 text-sm border-b border-gray-50 last:border-0">
                  <span className="text-gray-500">{cat}</span>
                  <span className={`font-medium ${n > 0 ? "text-indigo-600" : "text-gray-300"}`}>{n}</span>
                </div>
              );
            })}
          </div>
          <button onClick={() => { if (confirm("确认删除该项目？")) { projectStore.delete(project.id); onChange(); onBack(); } }}
            className="w-full text-sm text-red-400 hover:text-red-600 py-2 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
            删除项目
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CLIENTS
// ══════════════════════════════════════════════════════════════════════════
function ClientsView({ clients, projects, onOpen, onNew }: { clients: Client[]; projects: Project[]; onOpen: (id: string) => void; onNew: () => void }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">客户管理</h2>
        <button onClick={onNew} className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5">
          <Plus size={14} />新建客户
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {clients.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400 text-sm">暂无客户，点击右上角新建</div>}
        {clients.map(c => {
          const count = projects.filter(p => p.client_id === c.id).length;
          return (
            <div key={c.id} onClick={() => onOpen(c.id)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                  {c.company && <p className="text-xs text-gray-400 mt-0.5">{c.company}</p>}
                </div>
                <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{count} 个项目</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                {c.phone && <p>📞 {c.phone}</p>}
                {c.wechat && <p>💬 {c.wechat}</p>}
                {c.email && <p>✉️ {c.email}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CLIENT DETAIL
// ══════════════════════════════════════════════════════════════════════════
function ClientDetailView({ client, projects, onBack, onChange, onOpenProject }: {
  client: Client; projects: Project[]; onBack: () => void; onChange: () => void; onOpenProject: (id: string) => void;
}) {
  const [form, setForm] = useState({ name: client.name, company: client.company || "", phone: client.phone || "", email: client.email || "", wechat: client.wechat || "", notes: client.notes || "" });
  const [saved, setSaved] = useState(false);

  function save() {
    clientStore.update(client.id, { name: form.name, company: form.company || null, phone: form.phone || null, email: form.email || null, wechat: form.wechat || null, notes: form.notes || null });
    onChange(); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <button onClick={onBack} className="hover:text-gray-600 flex items-center gap-1"><ArrowLeft size={14} />客户管理</button>
        <ChevronRight size={12} />
        <span className="text-gray-700">{client.name}</span>
      </div>
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">客户信息</h3>
          {[["姓名", "name", "text"], ["公司", "company", "text"], ["电话", "phone", "text"], ["微信", "wechat", "text"], ["邮箱", "email", "email"]].map(([label, key, type]) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input type={type} className={inp} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-500 mb-1">备注</label>
            <textarea className={inp + " resize-none"} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700">
              {saved ? "已保存 ✓" : "保存"}
            </button>
            <button onClick={() => { if (confirm("确认删除该客户？")) { clientStore.delete(client.id); onChange(); onBack(); } }}
              className="px-3 text-sm text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:bg-red-50">
              删除
            </button>
          </div>
        </div>
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">关联项目</h3>
          <div className="space-y-2">
            {projects.length === 0 && <p className="text-xs text-gray-300">暂无关联项目</p>}
            {projects.map(p => (
              <button key={p.id} onClick={() => onOpenProject(p.id)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors text-left">
                <div>
                  <p className="text-sm text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.type}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status]}`}>{p.status}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FILES VIEW
// ══════════════════════════════════════════════════════════════════════════
function FilesView({ files, projects, onChange }: { files: LocalFile[]; projects: Project[]; onChange: () => void }) {
  const grouped = projects.reduce((acc, p) => {
    const pf = files.filter(f => f.project_id === p.id);
    if (pf.length > 0) acc[p.name] = pf;
    return acc;
  }, {} as Record<string, LocalFile[]>);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">文件中心</h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        {Object.keys(grouped).length === 0 && <p className="text-sm text-gray-400 text-center py-8">暂无文件，在项目详情页上传</p>}
        {Object.entries(grouped).map(([projName, pFiles]) => (
          <div key={projName} className="mb-5 last:mb-0">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{projName}</h3>
            <div className="space-y-2">
              {pFiles.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FileText size={15} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{f.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${CAT_COLOR[f.category]}`}>{f.category}</span>
                      {f.size && <span className="text-xs text-gray-400">{fmtSize(f.size)}</span>}
                      {!f.is_client_visible && <span className="text-xs text-gray-400">（仅内部）</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a href={f.dataUrl} download={f.name} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Download size={14} /></a>
                    <button onClick={() => { fileStore.toggleVisible(f.id); onChange(); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                      {f.is_client_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => { fileStore.delete(f.id); onChange(); }} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════════════════════════════
function NewProjectModal({ clients, onClose, onSave }: {
  clients: Client[];
  onClose: () => void;
  onSave: (data: { name: string; type: ProjectType; status: ProjectStatus; client_id: string; venue?: string; event_date?: string; notes?: string }) => void;
}) {
  const [form, setForm] = useState({ name: "", type: "体验课活动" as ProjectType, status: "线索" as ProjectStatus, client_id: "", venue: "", event_date: "", notes: "" });
  const [err, setErr] = useState("");
  function s(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <Modal title="新建项目" onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        <Field label="项目名称 *"><input className={inp} value={form.name} onChange={e => s("name", e.target.value)} placeholder="例：XX学校钢琴体验日" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="活动类型"><select className={inp} value={form.type} onChange={e => s("type", e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="当前状态"><select className={inp} value={form.status} onChange={e => s("status", e.target.value)}>{STATUSES.map(st => <option key={st}>{st}</option>)}</select></Field>
        </div>
        <Field label="关联客户 *">
          <select className={inp} value={form.client_id} onChange={e => s("client_id", e.target.value)}>
            <option value="">请选择客户</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company ? `${c.company} - ${c.name}` : c.name}</option>)}
          </select>
          {clients.length === 0 && <p className="text-xs text-amber-500 mt-1">请先在客户管理里新建客户</p>}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="活动地点"><input className={inp} value={form.venue} onChange={e => s("venue", e.target.value)} placeholder="例：XX商场B1" /></Field>
          <Field label="活动日期"><input type="date" className={inp} value={form.event_date} onChange={e => s("event_date", e.target.value)} /></Field>
        </div>
        <Field label="备注"><textarea className={inp + " resize-none"} rows={2} value={form.notes} onChange={e => s("notes", e.target.value)} /></Field>
        <div className="flex gap-3 pt-1">
          <button onClick={() => { if (!form.name || !form.client_id) { setErr("项目名称和客户为必填"); return; } onSave(form); }}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700">创建项目</button>
          <button onClick={onClose} className="text-sm px-5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">取消</button>
        </div>
      </div>
    </Modal>
  );
}

function NewClientModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<Client, "id" | "created_at" | "user_id">) => void }) {
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", wechat: "", notes: "" });
  const [err, setErr] = useState("");
  function s(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <Modal title="新建客户" onClose={onClose}>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <div className="space-y-3">
        <Field label="姓名 *"><input className={inp} value={form.name} onChange={e => s("name", e.target.value)} placeholder="联系人姓名" /></Field>
        <Field label="公司/机构"><input className={inp} value={form.company} onChange={e => s("company", e.target.value)} placeholder="例：XX商业广场" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="电话"><input className={inp} value={form.phone} onChange={e => s("phone", e.target.value)} /></Field>
          <Field label="微信"><input className={inp} value={form.wechat} onChange={e => s("wechat", e.target.value)} /></Field>
        </div>
        <Field label="邮箱"><input type="email" className={inp} value={form.email} onChange={e => s("email", e.target.value)} /></Field>
        <Field label="备注"><textarea className={inp + " resize-none"} rows={2} value={form.notes} onChange={e => s("notes", e.target.value)} /></Field>
        <div className="flex gap-3 pt-1">
          <button onClick={() => {
            if (!form.name) { setErr("姓名为必填"); return; }
            onSave({ name: form.name, company: form.company || null, phone: form.phone || null, email: form.email || null, wechat: form.wechat || null, notes: form.notes || null });
          }} className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700">创建客户</button>
          <button onClick={onClose} className="text-sm px-5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">取消</button>
        </div>
      </div>
    </Modal>
  );
}
