// ════════════════════════════════════════════════════════════════════════
// 线下运营系统 · 一期数据模型（用户档案 + 项目中心 + 状态流转）
// ════════════════════════════════════════════════════════════════════════

// 当前登录身份：公司管理端，或某个琴行
export type Role = "company" | "partner";

export interface Session {
  role: Role;
  partnerId: string | null; // role=partner 时指向当前琴行
}

// ── 琴行（用户档案）─────────────────────────────────────────────────────
export interface Partner {
  id: string;
  // 基本信息
  contactName: string;   // 负责人姓名
  storeName: string;     // 琴行/公司名
  province: string;
  city: string;
  district: string;
  phone: string;
  wechat: string | null;
  // 打款信息（琴行自填）
  payeeName: string | null;   // 收款人
  bankCard: string | null;    // 银行卡号
  bankName: string | null;    // 开户行
  alipay: string | null;      // 支付宝（可选）
  createdAt: string;
}

// ── 项目（活动）状态机 ──────────────────────────────────────────────────
export type ProjectStatus =
  | "草稿"
  | "待审核"
  | "已拒绝"
  | "执行中"
  | "待结算"
  | "已结算"
  | "已取消";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "草稿", "待审核", "已拒绝", "执行中", "待结算", "已结算", "已取消",
];

// 现场照片 / 直播切片（base64，已压缩）
export interface MediaItem {
  id: string;
  name: string;
  dataUrl: string;
}

export interface Project {
  id: string;
  partnerId: string;
  // 基本信息
  title: string;          // 活动名称
  province: string;
  city: string;
  district: string;
  venue: string;          // 具体地点
  eventDate: string | null;   // 活动日期
  planStart: string | null;   // 计划开始时间 HH:mm
  planEnd: string | null;     // 计划结束时间 HH:mm
  douyinAccount: string;      // 抖音账号（必填）
  status: ProjectStatus;
  rejectReason: string | null;
  // 结算资料（琴行活动后提交）
  liveStart: string | null;       // 实际直播开始 HH:mm
  liveEnd: string | null;         // 实际直播结束 HH:mm
  liveClips: MediaItem[];         // 直播切片/截图
  scenePhotos: MediaItem[];       // 现场照片（≥5 张才能提交）
  createdAt: string;
  updatedAt: string;
}

// ── 站内消息 ────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  // 收件人：公司端用 "company"，琴行端用 partnerId
  recipient: string;
  title: string;
  body: string;
  link: string | null;    // 点击跳转到哪个项目 id
  read: boolean;
  createdAt: string;
}
