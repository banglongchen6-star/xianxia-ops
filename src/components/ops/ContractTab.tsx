"use client";
import { useState, useRef, useEffect } from "react";
import { Project } from "@/lib/ops/types";
import { contractStore, partnerStore } from "@/lib/ops/store";
import { inp, Field, Btn } from "./ui";
import { FileText, PenLine, CheckCircle2, Printer } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════
// 合同（项目详情 Tab）
// ════════════════════════════════════════════════════════════════════════
export default function ContractTab({ project, isCompany }: { project: Project; isCompany: boolean }) {
  const partner = partnerStore.get(project.partnerId);
  const existing = contractStore.byProject(project.id);

  const defaultContent = generateTemplate(project, partner?.storeName ?? "", partner?.contactName ?? "");

  const [content, setContent] = useState(existing?.content ?? defaultContent);
  const [signature, setSignature] = useState<string | null>(existing?.partnerSignature ?? null);
  const [signMode, setSignMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [contentEditable, setContentEditable] = useState(!existing);

  function saveContract(sig?: string | null) {
    contractStore.upsert(project.id, {
      projectId: project.id,
      partnerId: project.partnerId,
      content,
      partnerSignature: sig !== undefined ? sig : signature,
      companySeal: null,
      signedAt: sig ? new Date().toISOString() : (existing?.signedAt ?? null),
    });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  function handleSign(dataUrl: string) {
    setSignature(dataUrl);
    setSignMode(false);
    saveContract(dataUrl);
  }

  function print() {
    const current = contractStore.byProject(project.id);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>合同 - ${project.title}</title>
      <style>
        body { font-family: "Noto Serif SC", "STSong", serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 2; color: #111; }
        h1 { text-align: center; font-size: 22px; margin-bottom: 32px; }
        pre { white-space: pre-wrap; font-family: inherit; font-size: 15px; }
        .sig-section { display: flex; justify-content: space-between; margin-top: 60px; }
        .sig-box { width: 45%; }
        .sig-label { font-size: 13px; color: #666; margin-bottom: 8px; }
        img { max-height: 80px; }
        .sig-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 8px; font-size: 13px; color: #666; }
      </style></head><body>
      <h1>路演合作协议</h1>
      <pre>${(current?.content ?? content).replace(/</g, "&lt;")}</pre>
      <div class="sig-section">
        <div class="sig-box">
          <div class="sig-label">甲方（公司）盖章：</div>
          <div class="sig-line">音乐密码（北京）科技有限公司</div>
        </div>
        <div class="sig-box">
          <div class="sig-label">乙方（琴行）签名：</div>
          ${current?.partnerSignature ? `<img src="${current.partnerSignature}" />` : `<div class="sig-line">&nbsp;</div>`}
          <div style="font-size:12px;color:#888;margin-top:4px;">${partner?.contactName ?? ""} · ${partner?.storeName ?? ""}</div>
        </div>
      </div>
      </body></html>`);
    win.document.close();
    win.print();
  }

  return (
    <div className="space-y-5">
      {/* 合同状态 */}
      {signature && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          <p className="text-sm font-medium text-green-800">合同已签署</p>
        </div>
      )}

      {/* 合同正文 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={16} className="text-indigo-500" />合同正文
          </h3>
          {isCompany && (
            <button onClick={() => setContentEditable(v => !v)}
              className="text-xs text-indigo-600 hover:underline">
              {contentEditable ? "收起编辑" : "编辑内容"}
            </button>
          )}
        </div>

        {contentEditable && isCompany ? (
          <div className="space-y-3">
            <textarea
              className={inp + " resize-none font-mono text-xs leading-relaxed"}
              rows={18}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div className="flex gap-3">
              <Btn onClick={() => saveContract()}>{saved ? "已保存 ✓" : "保存合同内容"}</Btn>
              <Btn variant="ghost" onClick={() => { setContent(defaultContent); }}>恢复模板</Btn>
            </div>
          </div>
        ) : (
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 font-sans">
            {content}
          </pre>
        )}
      </div>

      {/* 签名区 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">签名</h3>
        <div className="grid grid-cols-2 gap-6">
          {/* 甲方 */}
          <div>
            <p className="text-xs text-gray-400 mb-2">甲方（音乐密码·公司盖章）</p>
            <div className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center text-sm text-gray-300">
              [公司盖章区]
            </div>
          </div>

          {/* 乙方 */}
          <div>
            <p className="text-xs text-gray-400 mb-2">乙方（{partner?.storeName ?? "琴行"}·负责人签名）</p>
            {signature ? (
              <div className="border-2 border-green-200 rounded-xl h-24 flex items-center justify-center bg-green-50">
                <img src={signature} alt="签名" className="max-h-16 max-w-full object-contain" />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center text-sm text-gray-300">
                {!isCompany ? (
                  <button onClick={() => setSignMode(true)}
                    className="flex flex-col items-center gap-1 text-indigo-500 hover:text-indigo-700">
                    <PenLine size={20} />
                    <span className="text-xs">点击手写签名</span>
                  </button>
                ) : "待琴行签名"}
              </div>
            )}
            {!isCompany && signature && (
              <button onClick={() => setSignMode(true)} className="text-xs text-gray-400 hover:text-indigo-500 mt-1">
                重新签名
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 打印按钮 */}
      <div className="flex gap-3">
        <Btn variant="outline" onClick={print}>
          <span className="flex items-center gap-1.5"><Printer size={14} />打印 / 下载合同</span>
        </Btn>
      </div>

      {signMode && (
        <SignatureModal
          onClose={() => setSignMode(false)}
          onConfirm={handleSign}
        />
      )}
    </div>
  );
}

// ── 手写签名弹窗 ────────────────────────────────────────────────────────
function SignatureModal({ onClose, onConfirm }: {
  onClose: () => void; onConfirm: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    lastPos.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    e.preventDefault();
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }

  function stopDraw() { drawing.current = false; }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function confirm() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onConfirm(canvas.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><PenLine size={16} />手写签名</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-400 mb-3">请在下方区域用鼠标或触摸签名</p>
          <canvas
            ref={canvasRef}
            width={400}
            height={160}
            className="w-full rounded-xl border-2 border-gray-200 touch-none cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          <div className="flex gap-3 mt-4">
            <Btn onClick={confirm}>确认签名</Btn>
            <Btn variant="outline" onClick={clear}>清除重写</Btn>
            <Btn variant="ghost" onClick={onClose}>取消</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 合同模板生成 ─────────────────────────────────────────────────────────
function generateTemplate(project: Project, storeName: string, contactName: string): string {
  const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  return `路演合作协议

甲方：音乐密码（北京）科技有限公司
乙方：${storeName}（负责人：${contactName}）

根据双方协商，就以下活动达成如下合作协议：

一、活动基本信息
活动名称：${project.title}
活动地点：${project.province}${project.city}${project.district} ${project.venue}
活动日期：${project.eventDate ?? "待定"}
计划时段：${project.planStart ?? ""}—${project.planEnd ?? ""}
抖音账号：${project.douyinAccount}

二、甲方职责
1. 提供产品样品及展示物料；
2. 提供产品培训及话术支持；
3. 负责产品的发货及售后服务；
4. 活动结束后按协议约定支付劳务费及销售提成。

三、乙方职责
1. 负责组织、策划并执行本次路演活动；
2. 按时开展抖音直播，时长不少于计划时段；
3. 维护活动现场秩序，保证展示形象规范；
4. 活动结束后及时提交直播截图及现场照片（不少于5张）。

四、结算方式
按双方确认的销售提成比例及劳务费标准，活动结束并资料审核通过后 7 个工作日内打款。

五、其他约定
本协议一式两份，双方各执一份，经签名/盖章后生效。

签署日期：${today}`;
}
