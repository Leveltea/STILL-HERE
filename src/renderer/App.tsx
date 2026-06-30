import { ChevronDown, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import type { CaptureResult, CaptureSource, CapturedResource } from "../shared/types";
import type { CognitiveCheckpoint } from "../shared/types";
import { generateCheckpoint, getDemoNote } from "./checkpointGenerator";
import { CapturePanel } from "./components/CapturePanel";
import { CheckpointLibrary } from "./components/CheckpointLibrary";
import { FloatingCapsule } from "./components/FloatingCapsule";
import { ResumeView } from "./components/ResumeView";

type MainView = "new" | "history";

const browserDemoSources: CaptureSource[] = [
  {
    id: "browser-demo-notion-twig",
    sourceId: "browser-demo:notion-twig",
    title: "Notion - 20260616 TWIG API 对接会议沟通记录",
    appName: "Notion",
    isDemo: true
  },
  {
    id: "browser-demo-dingtalk-vpp",
    sourceId: "browser-demo:dingtalk-vpp",
    title: "钉钉 - VPP 常务会",
    appName: "钉钉",
    isDemo: true
  },
  {
    id: "browser-demo-claude-grid",
    sourceId: "browser-demo:claude-grid",
    title: "Claude - 电池聚合与电网服务的集成方案",
    appName: "Claude",
    isDemo: true
  },
  {
    id: "browser-demo-terminal-ai",
    sourceId: "browser-demo:terminal-ai",
    title: "Terminal - GPT 会话：工作断点 Demo 定位与问题排查",
    appName: "Terminal",
    isDemo: true
  }
]

const browserDemoCheckpoints: CognitiveCheckpoint[] = [];

function getSaveMyWorkApi() {
  if (window.saveMyWork) return window.saveMyWork;

  return {
    setExpanded: async () => undefined,
    setDockPeek: async (peeking: boolean) => ({ docked: false, peeking, side: "right" as const }),
    onDockStateChanged: () => () => undefined,
    listWindowSources: async () => ({
      sources: browserDemoSources,
      permissionDenied: false,
      usedDemoData: true,
      message: "UI 预览已载入 TWIG / VPP 对接工作现场。真实录屏时会使用你当前打开的窗口缩略图。"
    }),
    listCheckpoints: async () => browserDemoCheckpoints,
    saveCheckpoint: async (nextCheckpoint: CognitiveCheckpoint) => {
      browserDemoCheckpoints.unshift(nextCheckpoint);
      return [...browserDemoCheckpoints];
    },
    deleteCheckpoint: async (id: string) => {
      const index = browserDemoCheckpoints.findIndex((item) => item.id === id);
      if (index >= 0) browserDemoCheckpoints.splice(index, 1);
      return [...browserDemoCheckpoints];
    },
    resetCheckpoints: async () => {
      browserDemoCheckpoints.splice(0);
      return [];
    },
    openResource: async () => ({ opened: true, mode: "preview" as const }),
    getVersion: async () => "browser-demo"
  };
}

export function App() {
  const saveMyWork = getSaveMyWorkApi();
  const [expanded, setExpandedState] = useState(false);
  const [captureResult, setCaptureResult] = useState<CaptureResult>({
    sources: [],
    permissionDenied: false,
    usedDemoData: false
  });
  const [selectedResources, setSelectedResources] = useState<CapturedResource[]>([]);
  const [note, setNote] = useState("");
  const [checkpoint, setCheckpoint] = useState<CognitiveCheckpoint | null>(null);
  const [savedCheckpoints, setSavedCheckpoints] = useState<CognitiveCheckpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [docked, setDocked] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [dockSide, setDockSide] = useState<"left" | "right">("right");
  const [activeCheckpoint, setActiveCheckpoint] = useState<CognitiveCheckpoint | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [generatingCheckpoint, setGeneratingCheckpoint] = useState(false);
  const [mainView, setMainView] = useState<MainView>("new");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [focusWriteMode, setFocusWriteMode] = useState(false);
  const [autofillingNote, setAutofillingNote] = useState(false);

  async function setExpanded(next: boolean) {
    setExpandedState(next);
    await saveMyWork.setExpanded(next);
  }

  async function scanWindows(useDemoData = demoMode) {
    setLoading(true);
    try {
      const result = await saveMyWork.listWindowSources(useDemoData);
      setCaptureResult(result);
      setDemoMode(result.usedDemoData);
    } finally {
      setLoading(false);
    }
  }

  function addResource(source: CaptureSource) {
    setSelectedResources((current) => {
      if (current.some((resource) => resource.sourceId === source.sourceId)) return current;
      setCheckpoint(null);
      setSaveStatus("idle");
      return [...current, { ...source, selectedAt: new Date().toISOString() }];
    });
  }

  function addAllResources() {
    setSelectedResources((current) => {
      const existingIds = new Set(current.map((resource) => resource.sourceId));
      const additions = captureResult.sources
        .filter((source) => !existingIds.has(source.sourceId))
        .map((source) => ({ ...source, selectedAt: new Date().toISOString() }));

      if (additions.length === 0) return current;

      setCheckpoint(null);
      setSaveStatus("idle");
      return [...current, ...additions];
    });
  }

  function removeResource(sourceId: string) {
    setCheckpoint(null);
    setSaveStatus("idle");
    setSelectedResources((current) => current.filter((resource) => resource.sourceId !== sourceId));
  }

  function updateNote(nextNote: string) {
    setNote(nextNote);
    setCheckpoint(null);
    setSaveStatus("idle");
  }

  async function autofillNote() {
    if (autofillingNote || selectedResources.length === 0) return;
    setAutofillingNote(true);
    setMainView("new");
    setFocusWriteMode(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    updateNote(getDemoNote(selectedResources));
    setAutofillingNote(false);
  }

  async function generateDraft() {
    if (generatingCheckpoint) return;
    setSaveStatus("idle");
    setGeneratingCheckpoint(true);
    await new Promise((resolve) => setTimeout(resolve, 2400));
    setCheckpoint(generateCheckpoint(note, selectedResources));
    setGeneratingCheckpoint(false);
  }

  async function saveCurrentCheckpoint() {
    if (!checkpoint) return;
    const checkpoints = await saveMyWork.saveCheckpoint(checkpoint);
    setSavedCheckpoints(checkpoints);
    setSaveStatus("saved");
  }

  async function deleteSavedCheckpoint(id: string) {
    const checkpoints = await saveMyWork.deleteCheckpoint(id);
    setSavedCheckpoints(checkpoints);
    if (activeCheckpoint?.id === id) {
      setActiveCheckpoint(null);
    }
  }

  async function openResource(resource: CapturedResource) {
    await saveMyWork.openResource(resource);
  }

  async function resetDemo() {
    const checkpoints = await saveMyWork.resetCheckpoints();
    setSavedCheckpoints(checkpoints);
    setSelectedResources([]);
    setNote("");
    setCheckpoint(null);
    setActiveCheckpoint(null);
    setSaveStatus("idle");
    setFocusWriteMode(false);
    setAutofillingNote(false);
    await scanWindows(true);
  }

  useEffect(() => {
    if (selectedResources.length >= 3 && mainView === "new" && !checkpoint) {
      setFocusWriteMode(true);
    }
    if (selectedResources.length === 0) {
      setFocusWriteMode(false);
    }
  }, [selectedResources.length, mainView, checkpoint]);

  useEffect(() => {
    if (expanded && captureResult.sources.length === 0 && !loading) {
      void scanWindows(false);
    }
  }, [expanded]);

  useEffect(() => {
    void saveMyWork.listCheckpoints().then(setSavedCheckpoints);
  }, []);

  useEffect(
    () =>
      saveMyWork.onDockStateChanged(({ docked: nextDocked, peeking: nextPeeking, side }) => {
        setDocked(nextDocked);
        setPeeking(nextPeeking);
        setDockSide(side);
      }),
    []
  );

  if (!expanded) {
    return (
      <FloatingCapsule
        docked={docked}
        dockSide={dockSide}
        peeking={peeking}
        onPeekChange={(nextPeeking) => saveMyWork.setDockPeek(nextPeeking)}
        onExpand={() => setExpanded(true)}
      />
    );
  }

  return (
    <main className="panel-shell">
      <header className="panel-header drag-region">
        <button className="ghost-icon no-drag" aria-label="收起" onClick={() => setExpanded(false)}>
          <ChevronDown size={18} />
        </button>
        <div>
          <p className="eyebrow">保存工作断点</p>
          <h1>保存此刻的工作现场与思路</h1>
        </div>
        <nav className="view-tabs no-drag" aria-label="主视图">
          <button className={mainView === "new" && !activeCheckpoint ? "is-active" : ""} onClick={() => {
            setActiveCheckpoint(null);
            setMainView("new");
          }}>
            新建检查点
          </button>
          <button className={mainView === "history" && !activeCheckpoint ? "is-active" : ""} onClick={() => {
            setActiveCheckpoint(null);
            setMainView("history");
          }}>
            检查点库
          </button>
          <div className="more-menu-wrap">
            <button className="ghost-icon" aria-label="更多" type="button" onClick={() => setShowMoreMenu((shown) => !shown)}>
              <MoreHorizontal size={18} />
            </button>
            {showMoreMenu ? (
              <div className="more-menu">
                <button type="button" onClick={() => {
                  void resetDemo();
                  setShowMoreMenu(false);
                }}>
                  重置演示
                </button>
              </div>
            ) : null}
          </div>
        </nav>
      </header>

      {activeCheckpoint ? (
        <ResumeView
          checkpoint={activeCheckpoint}
          onBack={() => setActiveCheckpoint(null)}
          onOpenResource={openResource}
        />
      ) : mainView === "history" ? (
        <CheckpointLibrary
          checkpoints={savedCheckpoints}
          onResetDemo={resetDemo}
          onResume={setActiveCheckpoint}
          onDelete={deleteSavedCheckpoint}
        />
      ) : (
        <CapturePanel
          sources={captureResult.sources}
          selectedResources={selectedResources}
          loading={loading}
          permissionDenied={captureResult.permissionDenied}
          usedDemoData={captureResult.usedDemoData}
          message={captureResult.message}
          onRefresh={() => scanWindows(false)}
          onUseDemo={() => scanWindows(true)}
          onAdd={addResource}
          onAddAll={addAllResources}
          onRemove={removeResource}
          note={note}
          checkpoint={checkpoint}
          onNoteChange={updateNote}
          onAutofillNote={autofillNote}
          onGenerateCheckpoint={generateDraft}
          onSaveCheckpoint={saveCurrentCheckpoint}
          onCheckpointChange={(nextCheckpoint) => {
            setCheckpoint(nextCheckpoint);
            setSaveStatus("idle");
          }}
          saveStatus={saveStatus}
          generatingCheckpoint={generatingCheckpoint}
          autofillingNote={autofillingNote}
          focusWriteMode={focusWriteMode}
          onFocusWriteModeChange={setFocusWriteMode}
        />
      )}
    </main>
  );
}
