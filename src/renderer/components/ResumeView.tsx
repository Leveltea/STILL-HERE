import { ArrowLeft, CheckCircle2, Copy, ExternalLink, FileText, RotateCcw } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import type { CapturedResource, CognitiveCheckpoint } from "../../shared/types";

interface ResumeViewProps {
  checkpoint: CognitiveCheckpoint;
  onBack: () => void;
  onOpenResource: (resource: CapturedResource) => Promise<void>;
}

type ResumeMode = "recap" | "sources";

export function ResumeView({ checkpoint, onBack, onOpenResource }: ResumeViewProps) {
  const [mode, setMode] = useState<ResumeMode>("recap");
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());
  const restoreResources = useMemo(() => checkpoint.resources.slice(0, 6), [checkpoint.resources]);

  async function openResource(resource: CapturedResource) {
    await onOpenResource(resource);
    setOpenedIds((current) => new Set(current).add(resource.sourceId));
  }

  async function copyNextAction() {
    await navigator.clipboard?.writeText(buildNextActionCopy(checkpoint));
  }

  return (
    <section className="resume-shell">
      <header className="resume-header">
        <button className="ghost-icon no-drag" aria-label="返回捕获" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="eyebrow">恢复工作现场</p>
          <h1>{checkpoint.projectName}</h1>
        </div>
        {mode === "sources" ? (
          <button className="secondary-button no-drag" type="button" onClick={() => setMode("recap")}>
            <RotateCcw size={15} />
            回到续接
          </button>
        ) : null}
      </header>

      {mode === "recap" ? (
        <div className="resume-recap">
          <article className="recap-hero">
            <p className="eyebrow">你刚才判断到这里</p>
            <h2>{checkpoint.nextMove}</h2>
            <p>{checkpoint.currentThinking}</p>
          </article>

          <div className="resume-recap-grid">
            <article className="recap-card">
              <span>任务</span>
              <strong>{checkpoint.goal}</strong>
            </article>
            <article className="recap-card evidence">
              <span>关键证据</span>
              <ul>
                {checkpoint.progress.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="recap-card attention">
              <span>卡点</span>
              <ul>
                {checkpoint.blockers.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="recap-card">
              <span>回来第一步</span>
              <strong>{checkpoint.nextMove}</strong>
            </article>
          </div>

          <article className="next-action-card">
            <div>
              <p className="eyebrow">可直接继续</p>
              <h3>复制下一步要说/要做的话</h3>
              <p>{buildNextActionCopy(checkpoint)}</p>
            </div>
            <button className="primary-button" type="button" onClick={copyNextAction}>
              <Copy size={15} />
              复制下一步
            </button>
          </article>

          <div className="resume-actions">
            <button className="secondary-button" type="button" onClick={() => setMode("sources")}>
              <FileText size={15} />
              查看现场来源
            </button>
          </div>
        </div>
      ) : (
        <div className="restore-stage">
          <div className="restore-copy">
            <p className="eyebrow">相关现场</p>
            <h2>这些窗口只是证据来源，不是恢复本身。</h2>
            <p>需要原始上下文时再打开；主线仍然是上面的判断和下一步动作。</p>
          </div>

          <div className="restore-grid">
            {restoreResources.map((resource, index) => (
              <article
                className="restore-resource"
                key={resource.sourceId}
                style={{ "--delay": `${index * 110}ms` } as CSSProperties}
              >
                <div className="restore-thumb">
                  {resource.thumbnailDataUrl ? <img src={resource.thumbnailDataUrl} alt="" /> : <span>{index + 1}</span>}
                </div>
                <div className="restore-resource-footer">
                  {resource.iconDataUrl ? <img src={resource.iconDataUrl} alt="" /> : null}
                  <div>
                    <strong>{resource.title}</strong>
                    <span>{resource.appName ?? "窗口来源"}</span>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => openResource(resource)}>
                    {openedIds.has(resource.sourceId) ? <CheckCircle2 size={15} /> : <ExternalLink size={15} />}
                    {openedIds.has(resource.sourceId) ? "已处理" : "打开"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function buildNextActionCopy(checkpoint: CognitiveCheckpoint) {
  if (/save|保存|vpp|brp/i.test(`${checkpoint.projectName} ${checkpoint.goal} ${checkpoint.nextMove}`)) {
    return "我先确认一下：这个 Save 多次点击才响应的问题，目前是不是只在 mind energy BRP 场景出现？麻烦补一下复现步骤、页面路径、点击 Save 后是否有 loading，以及第一次 Save 后再次点 Save/Cancel 的预期区别。我这边再跟后端确认保存状态。";
  }

  const blocker = checkpoint.blockers[0] ? `当前卡点是：${checkpoint.blockers[0]}` : checkpoint.currentThinking;
  return `${checkpoint.nextMove} ${blocker}`;
}
