import { Columns3, PanelLeftOpen, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { CaptureSource, CapturedResource, CognitiveCheckpoint } from "../../shared/types";
import { CheckpointComposer } from "./CheckpointComposer";
import { WindowCard } from "./WindowCard";
import { WorkCapsule } from "./WorkCapsule";

interface CapturePanelProps {
  sources: CaptureSource[];
  selectedResources: CapturedResource[];
  loading: boolean;
  permissionDenied: boolean;
  usedDemoData: boolean;
  message?: string;
  onRefresh: () => void;
  onUseDemo: () => void;
  onAdd: (source: CaptureSource) => void;
  onAddAll: () => void;
  onRemove: (sourceId: string) => void;
  note: string;
  checkpoint: CognitiveCheckpoint | null;
  onNoteChange: (note: string) => void;
  onAutofillNote: () => void;
  onGenerateCheckpoint: () => void;
  onSaveCheckpoint: () => void;
  onCheckpointChange: (checkpoint: CognitiveCheckpoint) => void;
  saveStatus: "idle" | "saved";
  generatingCheckpoint: boolean;
  autofillingNote: boolean;
  focusWriteMode: boolean;
  onFocusWriteModeChange: (focusMode: boolean) => void;
}

export function CapturePanel({
  sources,
  selectedResources,
  loading,
  permissionDenied,
  usedDemoData,
  message,
  onRefresh,
  onUseDemo,
  onAdd,
  onAddAll,
  onRemove,
  note,
  checkpoint,
  onNoteChange,
  onAutofillNote,
  onGenerateCheckpoint,
  onSaveCheckpoint,
  onCheckpointChange,
  saveStatus,
  generatingCheckpoint,
  autofillingNote,
  focusWriteMode,
  onFocusWriteModeChange
}: CapturePanelProps) {
  const selectedCount = selectedResources.length;
  const selectedSourceIds = new Set(selectedResources.map((resource) => resource.sourceId));
  const currentStep = selectedCount === 0 ? 1 : note.trim().length === 0 ? 2 : 3;
  const [renderFocusMode, setRenderFocusMode] = useState(focusWriteMode);
  const [sourceTransitioning, setSourceTransitioning] = useState(false);

  useEffect(() => {
    if (focusWriteMode === renderFocusMode) return;

    setSourceTransitioning(true);
    const swapTimer = window.setTimeout(() => setRenderFocusMode(focusWriteMode), 150);
    const doneTimer = window.setTimeout(() => setSourceTransitioning(false), 780);

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(doneTimer);
    };
  }, [focusWriteMode, renderFocusMode]);

  return (
    <section className={`create-checkpoint-view ${focusWriteMode ? "is-focus-write" : ""}`}>
      <div className="step-flow" aria-label="创建检查点步骤">
        {["选择窗口", "留下断点", "生成检查点"].map((label, index) => {
          const step = index + 1;
          return (
            <div className={`step-pill ${currentStep === step ? "is-current" : currentStep > step ? "is-done" : ""}`} key={label}>
              <span>{step}</span>
              {label}
            </div>
          );
        })}
      </div>

    <section className="prototype-grid">
      <div className={`source-area ${focusWriteMode ? "is-collapsed" : ""} ${sourceTransitioning ? "is-transitioning" : ""}`}>
        {renderFocusMode ? (
          <div className="collapsed-source-summary">
            <div className="collapsed-source-header">
              <Sparkles size={17} />
              <div>
                <span>已识别窗口</span>
                <strong>{sources.length} 个窗口</strong>
              </div>
            </div>
            <div className="collapsed-mini-list" aria-label="已识别的窗口缩略图">
              {sources.map((source) => {
                const selected = selectedSourceIds.has(source.sourceId);
                return (
                <button
                  className={`collapsed-mini-card ${selected ? "is-selected" : ""}`}
                  key={source.sourceId}
                  type="button"
                  onClick={() => onAdd(source)}
                  disabled={selected}
                >
                  <div className="collapsed-mini-thumb">
                    {source.thumbnailDataUrl ? <img src={source.thumbnailDataUrl} alt="" /> : <Sparkles size={16} />}
                  </div>
                  <div>
                    <strong>{source.title}</strong>
                    <span>{selected ? "已加入检查点" : (source.appName ?? "窗口来源")}</span>
                  </div>
                </button>
                );
              })}
            </div>
            <button className="secondary-button" type="button" onClick={() => onFocusWriteModeChange(false)}>
              <PanelLeftOpen size={15} />
              展开窗口
            </button>
          </div>
        ) : (
          <div className="source-expanded-content">
        <div className="section-bar">
          <div>
            <p className="eyebrow">步骤 1</p>
            <h2>选择相关窗口</h2>
          </div>
          <div className="source-actions">
            <button className="secondary-button no-drag" onClick={() => onFocusWriteModeChange(true)} disabled={sources.length === 0}>
              <Columns3 size={15} />
              专注填写
            </button>
            <button className="secondary-button no-drag" onClick={onRefresh} disabled={loading}>
              <RefreshCw size={15} />
              {loading ? "扫描中" : sources.length > 0 ? "重新扫描" : "扫描当前窗口"}
            </button>
          </div>
        </div>

        {permissionDenied ? (
          <div className="permission-callout">
            <ShieldAlert size={18} />
            <div>
              <strong>保存工作现场需要“屏幕录制”权限，才能显示当前窗口预览。</strong>
              <p>你可以先用演示模式继续，稍后再重试真实窗口捕获。</p>
            </div>
            <button onClick={onUseDemo}>演示模式</button>
          </div>
        ) : null}

        {message && !permissionDenied ? <p className="inline-note">{message}</p> : null}
        <p className="privacy-note">窗口预览仅在本机处理，不会自动上传。</p>

        <div className="window-grid">
          {sources.map((source, index) => (
            <WindowCard
              key={source.sourceId}
              source={source}
              toneIndex={index}
              selected={selectedResources.some((resource) => resource.sourceId === source.sourceId)}
              onAdd={onAdd}
            />
          ))}
        </div>
          </div>
        )}
      </div>

      <div className="right-rail">
        <WorkCapsule sources={sources} resources={selectedResources} onRemove={onRemove} onAdd={onAdd} onAddAll={onAddAll} />
        <CheckpointComposer
          note={note}
          checkpoint={checkpoint}
          canEditNote={selectedResources.length > 0}
          canGenerate={selectedResources.length > 0 && note.trim().length > 0}
          onNoteChange={onNoteChange}
          onAutofill={onAutofillNote}
          onGenerate={onGenerateCheckpoint}
          onSave={onSaveCheckpoint}
          onCheckpointChange={onCheckpointChange}
          saveStatus={saveStatus}
          generating={generatingCheckpoint}
          autofilling={autofillingNote}
        />
      </div>
    </section>
    </section>
  );
}
