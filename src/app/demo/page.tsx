"use client";
import { useState } from "react";
import { LayoutDashboard, Users, FolderOpen, FileText, LogOut, Download, Eye, EyeOff, Trash2, Upload, Plus } from "lucide-react";

const MOCK_PROJECTS = [
  { id: "1", name: "万象城钢琴体验日", type: "体验课活动", status: "执行中", client: "万象城商业管理", venue: "B1中庭广场", event_date: "2026-06-15", files: 5, followups: 3 },
  { id: "2", name: "浦发银行亲子音乐会", type: "演出展览", status: "签约", client: "浦发银行零售部", venue: "浦发大厦多功能厅", event_date: "2026-07-20", files: 3, followups: 2 },
  { id: "3", name: "XX学区合作推广", type: "商务合作", status: "跟进中", client: "星河教育集团", venue: null, event_date: null, files: 1, followups: 4 },
  { id: "4", name: "来福士广场推广活动", type: "体验课活动", status: "线索", client: "凯德商业", venue: null, event_date: null, files: 0, followups: 1 },
  { id: "5", name: "华润万家品牌联名", type: "商务合作", status: "已完成", client: "华润商业", venue: "旗舰店", event_date: "2026-04-10", files: 7, followups: 8 },
  { id: "6", name: "某学校开学音乐节", type: "演出展览", status: "已取消", client: "某学校", venue: null, event_date: null, files: 2, followups: 2 },
];

const MOCK_CLIENTS = [
  { id: "1", name: "张经理", company: "万象城商业管理", phone: "138****8888", wechat: "zhang_mgr", email: "zhang@wsc.com", projects: 2, portal: true },
  { id: "2", name: "李总", company: "浦发银行零售部", phone: "139****9999", wechat: "li_spd", email: "li@spdb.com", projects: 1, portal: true },
  { id: "3", name: "王主任", company: "星河教育集团", phone: "137****7777", wechat: "wang_xh", email: null, projects: 1, portal: false },
  { id: "4", name: "陈总监", company: "凯德商业", phone: "136****6666", wechat: "chen_cpt", email: "chen@capitaland.com", projects: 1, portal: false },
];

const MOCK_FILES = [
  { id: "1", name: "场地平面图-万象城B1.pdf", category: "物料", size: "2.4MB", project: "万象城钢琴体验日", visible: true },
  { id: "2", name: "合同-万象城2026.pdf", category: "合同", size: "1.1MB", project: "万象城钢琴体验日", visible: false },
  { id: "3", name: "报价方案V2.xlsx", category: "报价单", size: "0.3MB", project: "万象城钢琴体验日", visible: true },
  { id: "4", name: "宣传海报-A3横版.jpg", category: "宣传资料", size: "5.2MB", project: "万象城钢琴体验日", visible: true },
  { id: "5", name: "合同-浦发银行.pdf", category: "合同", size: "0.9MB", project: "浦发银行亲子音乐会", visible: false },
  { id: "6", name: "演出方案说明书.docx", category: "宣传资料", size: "1.8MB", project: "浦发银行亲子音乐会", visible: true },
];

const STATUS_COLOR: Record<string, string> = {
  线索: "bg-gray-100 text-gray-600",
  跟进中: "bg-blue-100 text-blue-700",
  签约: "bg-purple-100 text-purple-700",
  执行中: "bg-yellow-100 text-yellow-700",
  已完成: "bg-green-100 text-green-700",
  已取消: "bg-red-100 text-red-600",
};

const CAT_COLOR: Record<string, string> = {
  物料: "bg-blue-50 text-blue-600",
  合同: "bg-purple-50 text-purple-600",
  报价单: "bg-yellow-50 text-yellow-700",
  宣传资料: "bg-green-50 text-green-600",
  其他: "bg-gray-50 text-gray-500",
};

const NAV = [
  { id: "board", icon: LayoutDashboard, label: "进度看板" },
  { id: "projects", icon: FolderOpen, label: "项目中心" },
  { id: "clients", icon: Users, label: "客户管理" },
  { id: "files", icon: FileText, label: "文件中心" },
];

export default function DemoPage() {
  const [page, setPage] = useState("board");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [followUpText, setFollowUpText] = useState("");
  const [followUps, setFollowUps] = useState([
    { id: "1", content: "已与张经理确认场地尺寸，长20m宽15m，钢琴可放中央", time: "5月27日 14:32" },
    { id: "2", content: "物料清单已发送，对方需要额外准备100个座椅", time: "5月26日 10:15" },
    { id: "3", content: "首次电话沟通，对方对体验日方案感兴趣，安排下周见面", time: "5月24日 16:00" },
  ]);
  const [portalView, setPortalView] = useState(false);

  function addFollowUp() {
    if (!followUpText.trim()) return;
    setFollowUps([{ id: Date.now().toString(), content: followUpText, time: "刚刚" }, ...followUps]);
    setFollowUpText("");
  }

  const STATUSES = ["线索", "跟进中", "签约", "执行中", "已完成", "已取消"];
  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = MOCK_PROJECTS.filter((p) => p.status === s);
    return acc;
  }, {} as Record<string, any[]>);

  if (portalView) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-gray-900">你好，万象城商业管理</h1>
              <p className="text-sm text-gray-400 mt-0.5">以下是音乐密码为您准备的项目资料</p>
            </div>
            <button onClick={() => setPortalView(false)} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 border border-gray-200 rounded-lg bg-white">
              切换内部视图
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">万象城钢琴体验日</h3>
                <p className="text-xs text-gray-400 mt-0.5">体验课活动</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">执行中</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[["活动地点", "B1中庭广场"], ["活动日期", "6月15日"], ["可下载文件", "3 个"]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">{k}</p>
                  <p className="text-gray-700 mt-0.5 font-medium text-sm">{v}</p>
                </div>
              ))}
            </div>
            <div className="bg-indigo-50 rounded-lg px-4 py-3 mb-4 text-sm text-indigo-700">
              场地确认完毕，物料准备中，请查收下方宣传海报和场地图纸
            </div>
            <h4 className="text-xs font-medium text-gray-500 mb-2">可下载资料</h4>
            <div className="space-y-2">
              {MOCK_FILES.filter(f => f.project === "万象城钢琴体验日" && f.visible).map(f => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText size={16} className="text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{f.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${CAT_COLOR[f.category]}`}>{f.category}</span>
                      <span className="text-xs text-gray-400">{f.size}</span>
                    </div>
                  </div>
                  <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded">
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col min-h-screen shrink-0">
        <div className="px-5 py-5 border-b border-gray-700">
          <h1 className="text-sm font-bold text-white">线下运营管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">音乐密码</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setPage(id); setSelectedProject(null); }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors ${page === id ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-700">
          <button onClick={() => setPortalView(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-300 hover:bg-gray-800 w-full mb-1">
            <Users size={16} />客户视角预览
          </button>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300">
            <LogOut size={16} />退出登录
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">

        {/* BOARD */}
        {page === "board" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">进度看板</h2>
              <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5">
                <Plus size={14} />新建项目
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[["全部项目", MOCK_PROJECTS.length, "text-gray-900"], ["进行中", 3, "text-indigo-600"], ["已完成", 1, "text-green-600"]].map(([label, val, color]) => (
                <div key={label as string} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${color}`}>{val}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {["线索", "跟进中", "执行中"].map(status => (
                <div key={status} className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>{status}</span>
                    <span className="text-xs text-gray-400">{grouped[status].length} 个</span>
                  </div>
                  <div className="p-3 space-y-2 min-h-24">
                    {grouped[status].map(p => (
                      <button key={p.id} onClick={() => { setSelectedProject(p); setPage("project-detail"); }}
                        className="block w-full text-left bg-gray-50 rounded-lg p-3 hover:bg-indigo-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.client}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">{p.type}</span>
                          {p.event_date && <span className="text-xs text-gray-400">{new Date(p.event_date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span>}
                        </div>
                      </button>
                    ))}
                    {grouped[status].length === 0 && <p className="text-xs text-gray-300 text-center py-4">暂无项目</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {["签约", "已完成", "已取消"].map(status => (
                <div key={status} className="bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>{status}</span>
                    <span className="text-xs text-gray-400">{grouped[status].length} 个</span>
                  </div>
                  <div className="p-3 space-y-2 min-h-16">
                    {grouped[status].map(p => (
                      <button key={p.id} onClick={() => { setSelectedProject(p); setPage("project-detail"); }}
                        className="block w-full text-left bg-gray-50 rounded-lg p-3 hover:bg-indigo-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.client}</p>
                      </button>
                    ))}
                    {grouped[status].length === 0 && <p className="text-xs text-gray-300 text-center py-4">暂无</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROJECT DETAIL */}
        {page === "project-detail" && selectedProject && (
          <div className="p-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <button onClick={() => setPage("projects")} className="hover:text-gray-600">项目中心</button>
              <span>/</span>
              <span className="text-gray-700">{selectedProject.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-5">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedProject.name}</h2>
                      <p className="text-sm text-gray-400 mt-0.5">{selectedProject.type}</p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[selectedProject.status]}`}>{selectedProject.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div><p className="text-xs text-gray-400">客户</p><p className="text-gray-700 mt-0.5">{selectedProject.client}</p></div>
                    <div><p className="text-xs text-gray-400">地点</p><p className="text-gray-700 mt-0.5">{selectedProject.venue || "—"}</p></div>
                    <div><p className="text-xs text-gray-400">活动日期</p><p className="text-gray-700 mt-0.5">{selectedProject.event_date ? new Date(selectedProject.event_date).toLocaleDateString("zh-CN") : "—"}</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">文件资料</h3>
                  <div className="border border-dashed border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                        {["物料", "合同", "报价单", "宣传资料", "其他"].map(c => <option key={c}>{c}</option>)}
                      </select>
                      <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded" />客户可见
                      </label>
                    </div>
                    <button className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
                      <Upload size={14} />点击上传文件
                    </button>
                  </div>
                  <div className="space-y-2">
                    {MOCK_FILES.filter(f => f.project === selectedProject.name).map(f => (
                      <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText size={16} className="text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{f.name}</p>
                          <div className="flex gap-2 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${CAT_COLOR[f.category]}`}>{f.category}</span>
                            <span className="text-xs text-gray-400">{f.size}</span>
                            {!f.visible && <span className="text-xs text-gray-400">（仅内部）</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Download size={14} /></button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded">{f.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                          <button className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                    {MOCK_FILES.filter(f => f.project === selectedProject.name).length === 0 && (
                      <p className="text-xs text-gray-300 py-2">暂无文件</p>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">跟进记录</h3>
                  <div className="flex gap-2 mb-4">
                    <textarea className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" rows={2}
                      placeholder="记录跟进内容..." value={followUpText} onChange={e => setFollowUpText(e.target.value)} />
                    <button onClick={addFollowUp} className="bg-indigo-600 text-white text-sm px-4 rounded-lg hover:bg-indigo-700">记录</button>
                  </div>
                  <div className="space-y-3">
                    {followUps.map(f => (
                      <div key={f.id} className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                        <div>
                          <p className="text-sm text-gray-700">{f.content}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{f.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">联系人</h3>
                  <div className="space-y-2 text-sm">
                    <div><p className="text-xs text-gray-400">姓名</p><p className="text-gray-700">张经理</p></div>
                    <div><p className="text-xs text-gray-400">公司</p><p className="text-gray-700">万象城商业管理</p></div>
                    <div><p className="text-xs text-gray-400">电话</p><a href="#" className="text-indigo-600">138****8888</a></div>
                    <div><p className="text-xs text-gray-400">微信</p><p className="text-gray-700">zhang_mgr</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">文件统计</h3>
                  {["物料", "合同", "报价单", "宣传资料"].map(cat => {
                    const count = MOCK_FILES.filter(f => f.project === selectedProject.name && f.category === cat).length;
                    return (
                      <div key={cat} className="flex justify-between items-center py-1.5 text-sm border-b border-gray-50 last:border-0">
                        <span className="text-gray-500">{cat}</span>
                        <span className={`font-medium ${count > 0 ? "text-indigo-600" : "text-gray-300"}`}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS LIST */}
        {page === "projects" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">项目中心</h2>
              <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5">
                <Plus size={14} />新建项目
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["项目名称", "客户", "类型", "状态", "活动日期", "文件"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_PROJECTS.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedProject(p); setPage("project-detail"); }}>
                      <td className="px-4 py-3 text-indigo-600 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.client}</td>
                      <td className="px-4 py-3 text-gray-500">{p.type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.event_date ? new Date(p.event_date).toLocaleDateString("zh-CN") : "—"}</td>
                      <td className="px-4 py-3 text-gray-400">{p.files} 个</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CLIENTS */}
        {page === "clients" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">客户管理</h2>
              <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5">
                <Plus size={14} />新建客户
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {MOCK_CLIENTS.map(c => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{c.company}</p>
                    </div>
                    <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{c.projects} 个项目</span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p>📞 {c.phone}</p>
                    <p>💬 {c.wechat}</p>
                    {c.email && <p>✉️ {c.email}</p>}
                  </div>
                  {c.portal
                    ? <p className="text-xs text-green-500 mt-3">已激活门户账号</p>
                    : <button className="text-xs text-indigo-400 mt-3 hover:underline">邀请开通门户 →</button>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILES */}
        {page === "files" && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">文件中心</h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              {Object.entries(MOCK_FILES.reduce((acc, f) => {
                if (!acc[f.project]) acc[f.project] = [];
                acc[f.project].push(f);
                return acc;
              }, {} as Record<string, any[]>)).map(([proj, files]) => (
                <div key={proj} className="mb-5 last:mb-0">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{proj}</h3>
                  <div className="space-y-2">
                    {(files as any[]).map((f: any) => (
                      <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <FileText size={16} className="text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{f.name}</p>
                          <div className="flex gap-2 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${CAT_COLOR[f.category]}`}>{f.category}</span>
                            <span className="text-xs text-gray-400">{f.size}</span>
                            {!f.visible && <span className="text-xs text-gray-400">（仅内部）</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Download size={14} /></button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded">{f.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                          <button className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
