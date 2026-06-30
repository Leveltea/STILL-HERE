import { ClipboardPen, LockKeyhole, Sparkles } from "lucide-react";
import type { CognitiveCheckpoint } from "../../shared/types";
import { CheckpointParticleBurst } from "./CheckpointParticleBurst";

interface CheckpointComposerProps {
  note: string;
  checkpoint: CognitiveCheckpoint | null;
  canEditNote: boolean;
  canGenerate: boolean;
  onNoteChange: (note: string) => void;
  onAutofill: () => void;
  onGenerate: () => void;
  onSave: () => void;
  onCheckpointChange: (checkpoint: CognitiveCheckpoint) => void;
  saveStatus: "idle" | "saved";
  generating: boolean;
  autofilling: boolean;
}

export function CheckpointComposer({
  note,
  checkpoint,
  canEditNote,
  canGenerate,
  onNoteChange,
  onAutofill,
  onGenerate,
  onSave,
  onCheckpointChange,
  saveStatus,
  generating,
  autofilling
}: CheckpointComposerProps) {
  if (checkpoint) {
    return (
      <section className="checkpoint-review">
        <div className="section-bar compact">
          <div>
            <p className="eyebrow">检查点预览</p>
            <h2>保存前可编辑</h2>
          </div>
        </div>

        <label className="field emphasis-field">
          <span>目标</span>
          <textarea
            value={checkpoint.goal}
            onChange={(event) => onCheckpointChange({ ...checkpoint, goal: event.target.value })}
          />
        </label>

        <label className="field">
          <span>当前判断</span>
          <textarea
            value={checkpoint.currentThinking}
            onChange={(event) => onCheckpointChange({ ...checkpoint, currentThinking: event.target.value })}
          />
        </label>

        <label className="field emphasis-field">
          <span>卡点</span>
          <textarea
            value={checkpoint.blockers.join("\n")}
            onChange={(event) =>
              onCheckpointChange({
                ...checkpoint,
                blockers: event.target.value.split("\n").filter(Boolean)
              })
            }
          />
        </label>

        <label className="field emphasis-field">
          <span>下一步</span>
          <textarea
            value={checkpoint.nextMove}
            onChange={(event) => onCheckpointChange({ ...checkpoint, nextMove: event.target.value })}
          />
        </label>

        <button className="primary-button generate-button" type="button" onClick={onSave}>
          {saveStatus === "saved" ? "已保存到检查点库" : "保存检查点"}
        </button>
      </section>
    );
  }

  return (
    <section className={`checkpoint-composer ${generating ? "is-generating" : ""} ${autofilling ? "is-autofilling" : ""}`}>
      <CheckpointParticleBurst active={generating} />
      {autofilling ? (
        <div className="autofill-scan-layer" aria-live="polite">
          <div className="autofill-orbit" />
          <p className="eyebrow">正在自动识别</p>
          <strong>归类窗口上下文</strong>
          <span>提取沟通、资料和下一步</span>
        </div>
      ) : null}
      {generating ? (
        <div className="checkpoint-generating-copy" aria-live="polite">
          <p className="eyebrow">正在生成检查点</p>
          <strong>压缩窗口、备注和下一步动作</strong>
          <span>大约 2 秒后完成</span>
        </div>
      ) : null}

      <div className="section-bar compact">
        <div>
          <p className="eyebrow">留下工作断点</p>
          <h2>{canEditNote ? "写给之后的自己" : "选择窗口后再填写"}</h2>
        </div>
        <button className="secondary-button autofill-button" type="button" disabled={!canEditNote || autofilling} onClick={onAutofill}>
          <ClipboardPen size={15} />
          {autofilling ? "识别中" : "自动识别填入"}
        </button>
      </div>

      {!canEditNote ? (
        <div className="note-locked">
          <LockKeyhole size={18} />
          <span>下一步：选择窗口后，留下你的工作断点</span>
        </div>
      ) : (
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="告诉之后的自己：你正在做什么、卡在哪里、回来后先做什么？"
        />
      )}

      <p className="generate-helper">
        {!canEditNote
          ? "还需要：选择至少 1 个窗口"
          : !canGenerate
            ? "还需要：填写工作断点"
          : "可生成检查点，备注越清楚，恢复越准确"}
      </p>

      <button className="primary-button generate-button" type="button" disabled={!canGenerate || generating || autofilling} onClick={onGenerate}>
        <Sparkles size={15} />
        {generating ? "生成中" : "生成检查点"}
      </button>
    </section>
  );
}
