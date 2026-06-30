import { AppWindow, Plus } from "lucide-react";
import type { CaptureSource } from "../../shared/types";

interface WindowCardProps {
  source: CaptureSource;
  toneIndex: number;
  selected: boolean;
  onAdd: (source: CaptureSource) => void;
}

export function WindowCard({ source, toneIndex, selected, onAdd }: WindowCardProps) {
  function handleDragStart(event: React.DragEvent<HTMLElement>) {
    event.dataTransfer.setData("application/x-save-my-work-source", JSON.stringify(source));
    event.dataTransfer.effectAllowed = "copy";
    event.currentTarget.classList.add("is-dragging");
  }

  function handleDragEnd(event: React.DragEvent<HTMLElement>) {
    event.currentTarget.classList.remove("is-dragging");
  }

  return (
    <article
      className={`window-card ${selected ? "is-selected" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`thumbnail tone-${(toneIndex % 6) + 1}`}>
        {source.thumbnailDataUrl ? <img src={source.thumbnailDataUrl} alt="" /> : <AppWindow size={34} />}
      </div>
      <div className="window-card-footer">
        <div className="window-title-row">
          {source.iconDataUrl ? <img className="source-icon" src={source.iconDataUrl} alt="" /> : null}
          <div>
            <strong>{source.title}</strong>
            <span>{source.appName ?? (source.isDemo ? "演示来源" : "窗口来源")}</span>
          </div>
        </div>
        <button type="button" disabled={selected} onClick={() => onAdd(source)} aria-label={`添加 ${source.title}`}>
          <Plus size={14} />
        </button>
      </div>
    </article>
  );
}
