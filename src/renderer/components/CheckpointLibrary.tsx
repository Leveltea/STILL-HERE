import { Play, RotateCcw, Trash2 } from "lucide-react";
import type { CognitiveCheckpoint } from "../../shared/types";

interface CheckpointLibraryProps {
  checkpoints: CognitiveCheckpoint[];
  onResetDemo?: () => void;
  onResume: (checkpoint: CognitiveCheckpoint) => void;
  onDelete: (id: string) => void;
}

function formatSavedTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function summarizeCheckpoint(checkpoint: CognitiveCheckpoint) {
  if (checkpoint.currentThinking && checkpoint.nextMove) {
    return `${checkpoint.currentThinking} 下一步：${checkpoint.nextMove}`;
  }
  return checkpoint.nextMove;
}

export function CheckpointLibrary({ checkpoints, onResetDemo, onResume, onDelete }: CheckpointLibraryProps) {
  return (
    <section className="checkpoint-library">
      <div className="library-header">
        <div>
          <p className="eyebrow">检查点库</p>
          <h2>{checkpoints.length === 0 ? "还没有保存的检查点" : "恢复之前的工作现场"}</h2>
        </div>
        {onResetDemo ? (
          <button className="secondary-button" type="button" onClick={onResetDemo}>
            <RotateCcw size={14} />
            重置演示
          </button>
        ) : null}
      </div>

      {checkpoints.length === 0 ? (
        <p className="library-empty">保存后的工作检查点会出现在这里。</p>
      ) : (
        <div className="library-list">
          {checkpoints.slice(0, 3).map((checkpoint) => (
            <article className="library-card" key={checkpoint.id}>
              <div>
                <strong>{checkpoint.projectName}</strong>
                <span>
                  {formatSavedTime(checkpoint.updatedAt)} · {checkpoint.resources.length} 个资源
                </span>
                <p>{summarizeCheckpoint(checkpoint)}</p>
              </div>
              <div className="library-card-actions">
                <button className="primary-button" type="button" onClick={() => onResume(checkpoint)}>
                  <Play size={14} />
                  恢复
                </button>
                <button className="ghost-icon" aria-label="删除检查点" type="button" onClick={() => onDelete(checkpoint.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
