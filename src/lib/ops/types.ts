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
  | "执行中"
  | "待结算"
  | "已结算"
  | "已取消";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "草稿", "执行中", "待结算", "已结算", "已取消",
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

// ════════════════════════════════════════════════════════════════════════
// 二期：产品&提成 / 订单 / 结算
// ════════════════════════════════════════════════════════════════════════

// ── 产品目录 ─────────────────────────────────────────────────────────────
export type CommissionType = "percent" | "fixed";

export interface Product {
  id: string;
  name: string;           // 产品名称
  model: string;          // 型号
  price: number;          // 建议零售价（元）
  commissionType: CommissionType; // percent=比例提成, fixed=固定提成
  commissionValue: number;        // 比例时填 0-100（%），固定时填元
  description: string;
  stock: number;
  createdAt: string;
}

// ── 订单 ─────────────────────────────────────────────────────────────────
export type ShippingStatus = "待发货" | "已发货" | "已签收";

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;          // 实际成交价
  commissionType: CommissionType;
  commissionValue: number;
  commissionAmount: number;   // 计算后提成金额
}

export interface Order {
  id: string;
  projectId: string;
  partnerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;        // 总销售额
  totalCommission: number;    // 总提成
  paymentSide: "公司收款" | "琴行收款";
  shippingStatus: ShippingStatus;
  trackingNumber: string | null;
  notes: string;
  createdAt: string;
}

// ── 结算单 ───────────────────────────────────────────────────────────────
export interface Settlement {
  id: string;
  projectId: string;
  laborFee: number;           // 劳务费（公司手动填入）
  totalCommission: number;    // 自动汇总订单提成
  totalPayout: number;        // 劳务费 + 提成
  paidAt: string | null;
  voucherDataUrl: string | null; // 打款凭证图片
  notes: string;
  createdAt: string;
}

// ════════════════════════════════════════════════════════════════════════
// 三期：样品物料 / 合同 / 文件中心
// ════════════════════════════════════════════════════════════════════════

// ── 统一物料库 ─────────────────────────────────────────────────────────
export interface MaterialLibItem {
  id: string;
  name: string;
  category: string;
  notes: string;
  trackable: boolean;   // 需要序列号/持有人追踪（样品/设备类）
  createdAt: string;
}

// ── 可追踪物料的实物单元（序列号级别管理） ────────────────────────────
export type UnitStatus = "在库" | "已发出" | "已归还";

export interface MaterialUnit {
  id: string;
  libItemId: string;
  serial: string;
  status: UnitStatus;
  currentPartnerId: string | null;
  expectedReturnDate: string | null;
  notes: string;
  createdAt: string;
}

// ── 活动物料清单条目 ─────────────────────────────────────────────────
export interface ChecklistItem {
  id: string;
  projectId: string;
  libItemId: string | null;           // null = 自定义条目
  name: string;
  category: string;
  source: "company" | "partner";      // 谁添加的
  preparedBy: "自备" | "公司备" | null; // null = 客户未填
  quantity: number;
  notes: string;
  companyNotes: string;               // 公司审核时的备注
  createdAt: string;
}

// ── 物料申请单 ──────────────────────────────────────────────────────
export type MaterialRequestStatus = "待处理" | "已锁定" | "已完成";

export interface MaterialRequest {
  id: string;
  projectId: string;
  partnerId: string;
  status: MaterialRequestStatus;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  partnerNotes: string;
  trackingNumbers: string[];
  companyNotes: string;
  lockedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── 合同 ─────────────────────────────────────────────────────────────────
export interface Contract {
  id: string;
  projectId: string;
  partnerId: string;
  content: string;              // 合同正文（模板填充后可编辑）
  partnerSignature: string | null; // 琴行手写签名 dataUrl
  companySeal: string | null;      // 公司盖章（预设图片 dataUrl）
  signedAt: string | null;
  createdAt: string;
}

// ── 文件中心 ─────────────────────────────────────────────────────────────
export interface ResourceCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface ResourceFile {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  dataUrl: string;
  mimeType: string;
  size: number;               // 原始字节数
  createdAt: string;
}
