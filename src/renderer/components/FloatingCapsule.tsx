import { CircleDot, GripVertical, Sparkles } from "lucide-react";
import { CapsuleParticleAura } from "./CapsuleParticleAura";

interface FloatingCapsuleProps {
  docked: boolean;
  dockSide: "left" | "right";
  peeking: boolean;
  onPeekChange: (peeking: boolean) => void;
  onExpand: () => void;
}

export function FloatingCapsule({ docked, dockSide, peeking, onPeekChange, onExpand }: FloatingCapsuleProps) {
  const compact = docked && !peeking;

  return (
    <div
      className={`floating-window-stage dock-${dockSide}`}
      onMouseEnter={() => {
        if (docked) onPeekChange(true);
      }}
    >
      <div
        className={`floating-capsule drag-region ${compact ? "is-docked" : ""} ${peeking ? "is-peeking" : ""}`}
        role="group"
        aria-label="保存工作现场悬浮窗"
      >
        <CapsuleParticleAura active={peeking} />
        <button className="capsule-open-target no-drag" type="button" onClick={onExpand} aria-label="打开保存工作现场">
          <span className="capsule-mark">
            <CircleDot size={18} />
          </span>
          <span className="capsule-copy">
            <strong>保存工作现场</strong>
            <small>工作可暂停，思路不重启。</small>
          </span>
        </button>
        <span className="capsule-drag-handle drag-region" aria-hidden="true">
          <GripVertical size={15} />
        </span>
        <Sparkles className="capsule-spark" size={16} />
      </div>
    </div>
  );
}
