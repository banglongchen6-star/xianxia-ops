export type ProjectType = "体验课活动" | "商务合作" | "演出展览";
export type ProjectStatus = "线索" | "跟进中" | "签约" | "执行中" | "已完成" | "已取消";
export type FileCategory = "物料" | "合同" | "报价单" | "宣传资料" | "其他";
export type UserRole = "admin" | "client";

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  client_id: string;
  venue: string | null;
  event_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clients?: Client;
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  wechat: string | null;
  notes: string | null;
  created_at: string;
  user_id: string | null;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  category: FileCategory;
  storage_path: string;
  size: number | null;
  uploaded_by: string;
  is_client_visible: boolean;
  created_at: string;
}

export interface FollowUp {
  id: string;
  project_id: string;
  content: string;
  created_by: string;
  created_at: string;
}
