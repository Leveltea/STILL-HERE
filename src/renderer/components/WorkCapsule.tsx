import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { CaptureSource, CapturedResource } from "../../shared/types";

interface WorkCapsuleProps {
  sources: CaptureSource[];
  resources: CapturedResource[];
  onAdd: (source: CaptureSource) => void;
  onAddAll: () => void;
  onRemove: (sourceId: string) => void;
}

export function WorkCapsule({ sources, resources, onAdd, onAddAll, onRemove }: WorkCapsuleProps) {
  const [dragActive, setDragActive] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragActive(false);
    const payload = event.dataTransfer.getData("application/x-save-my-work-source");
    if (!payload) return;
    onAdd(JSON.parse(payload) as CaptureSource);
  }

  return (
    <aside
      className={`work-capsule ${dragActive ? "is-drag-active" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <div className="work-capsule-header">
        <div>
          <p className="eyebrow">当前检查点</p>
          <h2>已选择 {resources.length} 个窗口</h2>
        </div>
        <button
          className="add-all-windows-button"
          type="button"
          onClick={onAddAll}
          disabled={sources.length === 0 || resources.length >= sources.length}
        >
          <Plus size={14} />
          全部添加
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="capsule-drop-empty">
          <div className="drop-icon">
            <Plus size={20} />
          </div>
          <strong>{dragActive ? "松开以加入检查点" : "将窗口拖到这里"}</strong>
          <span>或点击窗口卡片上的添加按钮</span>
        </div>
      ) : (
        <div className="selected-list">
          {resources.map((resource) => (
            <div className="selected-resource" key={resource.sourceId}>
              <div>
                <strong>{resource.title}</strong>
                <span>{resource.appName ?? "已捕获资源"}</span>
              </div>
              <button type="button" aria-label={`移除 ${resource.title}`} onClick={() => onRemove(resource.sourceId)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
