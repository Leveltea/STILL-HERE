import { app, BrowserWindow, ipcMain, screen, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getWindowSources } from "./captureService.js";
import { deleteCheckpoint, listCheckpoints, resetCheckpoints, saveCheckpoint } from "./checkpointStore.js";
import type { CapturedResource, CognitiveCheckpoint } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let isExpanded = false;
let isDocked = false;
let isPeeking = false;
let isAdjustingBounds = false;
let peekMonitor: NodeJS.Timeout | undefined;
let dockSide: "left" | "right" = "right";
let restoreDockAfterCollapse = false;

const collapsedBounds = { width: 236, height: 58 };
const dockedBounds = { width: 66, height: 58 };
const expandedBounds = { width: 980, height: 680 };
const shadowPadding = 34;
const dockThreshold = 24;
const visualEdgeInset = 2;

function withShadowPadding(bounds: { width: number; height: number }) {
  return {
    width: bounds.width + shadowPadding * 2,
    height: bounds.height + shadowPadding * 2
  };
}

function getCollapsedWindowSize() {
  return withShadowPadding(collapsedBounds);
}

function getDockedWindowSize() {
  return withShadowPadding(dockedBounds);
}

function getDockX(workArea: Electron.Rectangle, windowSize: { width: number }, dockedOnLeft: boolean) {
  if (dockedOnLeft) {
    return workArea.x + visualEdgeInset - shadowPadding;
  }

  return workArea.x + workArea.width - windowSize.width + shadowPadding - visualEdgeInset;
}

function getDockSideFromBounds(bounds: Electron.Rectangle, workArea: Electron.Rectangle): "left" | "right" {
  return bounds.x + bounds.width / 2 < workArea.x + workArea.width / 2 ? "left" : "right";
}

function getInitialBounds() {
  const display = screen.getPrimaryDisplay();
  const workArea = display.workArea;
  const initialSize = getCollapsedWindowSize();
  return {
    ...initialSize,
    x: workArea.x + workArea.width - initialSize.width - 32,
    y: workArea.y + Math.round(workArea.height * 0.32)
  };
}

async function createMainWindow() {
  const initialBounds = getInitialBounds();
  console.log("[Save My Work] Creating floating window", initialBounds);

  mainWindow = new BrowserWindow({
    ...initialBounds,
    minWidth: getDockedWindowSize().width,
    minHeight: getDockedWindowSize().height,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    resizable: false,
    movable: true,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    title: "保存工作现场",
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, "floating");
  mainWindow.on("move", maybeDockCollapsedWindow);

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log("[Save My Work] Loading dev URL", process.env.VITE_DEV_SERVER_URL);
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    console.log("[Save My Work] Loading built renderer");
    await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  showFloatingWindow();

  mainWindow.once("ready-to-show", () => {
    console.log("[Save My Work] Floating window ready");
    showFloatingWindow();
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    console.error("[Save My Work] Renderer failed to load", errorCode, errorDescription);
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[Save My Work] Renderer process gone", details);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    sendDockState();
    showFloatingWindow();
  });
}

function showFloatingWindow() {
  if (!mainWindow) return;
  console.log("[Save My Work] Showing floating window");
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true, "floating");
  mainWindow.moveTop();
  mainWindow.focus();
}

function setExpanded(expanded: boolean) {
  if (!mainWindow || isExpanded === expanded) return;

  const current = mainWindow.getBounds();
  const display = screen.getDisplayMatching(current);
  const workArea = display.workArea;

  if (expanded) {
    restoreDockAfterCollapse = isDocked || isPeeking;
    dockSide = getDockSideFromBounds(current, workArea);
    isExpanded = true;
    isDocked = false;
    isPeeking = false;
    stopPeekMonitor();
    sendDockState();
  } else {
    isExpanded = false;
  }

  const shouldRestoreDock = !expanded && restoreDockAfterCollapse;
  const nextSize = expanded
    ? expandedBounds
    : shouldRestoreDock
      ? getDockedWindowSize()
      : isDocked
        ? getDockedWindowSize()
        : getCollapsedWindowSize();

  if (shouldRestoreDock) {
    restoreDockAfterCollapse = false;
    isDocked = true;
    isPeeking = false;
    stopPeekMonitor();
    sendDockState();
  }

  const x =
    shouldRestoreDock || (!expanded && isDocked)
      ? getDockX(workArea, nextSize, dockSide === "left")
      : Math.min(
          Math.max(current.x + current.width - nextSize.width, workArea.x + 18),
          workArea.x + workArea.width - nextSize.width - 18
        );
  const y = Math.min(
    Math.max(current.y, workArea.y + 18),
    workArea.y + workArea.height - nextSize.height - 18
  );

  mainWindow.setResizable(expanded);
  mainWindow.setBounds({ x, y, ...nextSize }, true);
  mainWindow.setResizable(false);
}

function setDocked(docked: boolean, side?: "left" | "right") {
  if (!mainWindow) return;
  if (isDocked === docked && (!side || side === dockSide)) return;
  isDocked = docked;
  if (side) {
    dockSide = side;
  }
  if (!docked) {
    isPeeking = false;
    stopPeekMonitor();
  }
  sendDockState();
}

function sendDockState() {
  mainWindow?.webContents.send("window:dock-state-changed", { docked: isDocked, peeking: isPeeking, side: dockSide });
}

function setDockPeek(peeking: boolean) {
  if (!mainWindow || !isDocked || isExpanded) return;

  if (!peeking) {
    stopPeekMonitor();
    applyDockPeek(false);
    return;
  }

  applyDockPeek(true);
  startPeekMonitor();
}

function applyDockPeek(peeking: boolean) {
  if (!mainWindow || !isDocked || isExpanded || isPeeking === peeking) return;

  const current = mainWindow.getBounds();
  const display = screen.getDisplayMatching(current);
  const workArea = display.workArea;
  const nextSize = peeking ? getCollapsedWindowSize() : getDockedWindowSize();
  const x = getDockX(workArea, nextSize, dockSide === "left");
  const y = Math.min(Math.max(current.y, workArea.y + 18), workArea.y + workArea.height - nextSize.height - 18);

  isAdjustingBounds = true;

  if (peeking) {
    mainWindow.setBounds({ x, y, ...nextSize }, false);
    setTimeout(() => {
      isPeeking = true;
      sendDockState();
      isAdjustingBounds = false;
    }, 30);
    return;
  }

  isPeeking = false;
  sendDockState();
  setTimeout(() => {
    if (!mainWindow || isPeeking || !isDocked || isExpanded) {
      isAdjustingBounds = false;
      return;
    }
    mainWindow.setBounds({ x, y, ...nextSize }, false);
    isAdjustingBounds = false;
  }, 190);
}

function startPeekMonitor() {
  if (peekMonitor) return;

  peekMonitor = setInterval(() => {
    if (!mainWindow || !isDocked || isExpanded || !isPeeking || isAdjustingBounds) return;

    const cursor = screen.getCursorScreenPoint();
    const bounds = mainWindow.getBounds();
    const margin = 26;
    const cursorInside =
      cursor.x >= bounds.x - margin &&
      cursor.x <= bounds.x + bounds.width + margin &&
      cursor.y >= bounds.y - margin &&
      cursor.y <= bounds.y + bounds.height + margin;

    if (!cursorInside) {
      stopPeekMonitor();
      applyDockPeek(false);
    }
  }, 140);
}

function stopPeekMonitor() {
  if (!peekMonitor) return;
  clearInterval(peekMonitor);
  peekMonitor = undefined;
}

function maybeDockCollapsedWindow() {
  if (!mainWindow || isExpanded || isAdjustingBounds) return;

  const current = mainWindow.getBounds();
  const display = screen.getDisplayMatching(current);
  const workArea = display.workArea;
  const nearLeft = current.x <= workArea.x + dockThreshold;
  const nearRight = current.x + current.width >= workArea.x + workArea.width - dockThreshold;
  const shouldDock = nearLeft || nearRight;
  const nextDockSide: "left" | "right" = nearLeft ? "left" : "right";

  if (shouldDock === isDocked && (!shouldDock || nextDockSide === dockSide)) return;

  const nextSize = shouldDock ? getDockedWindowSize() : getCollapsedWindowSize();
  const x = shouldDock ? getDockX(workArea, nextSize, nextDockSide === "left") : current.x;
  const y = Math.min(Math.max(current.y, workArea.y + 18), workArea.y + workArea.height - nextSize.height - 18);

  setDocked(shouldDock, shouldDock ? nextDockSide : undefined);
  isAdjustingBounds = true;
  mainWindow.setBounds({ x, y, ...nextSize }, true);
  setTimeout(() => {
    isAdjustingBounds = false;
  }, 160);
}

app.whenReady().then(async () => {
  await createMainWindow();

  ipcMain.handle("window:set-expanded", (_event, expanded: boolean) => {
    setExpanded(expanded);
    return { expanded: isExpanded };
  });

  ipcMain.handle("window:set-dock-peek", (_event, peeking: boolean) => {
    setDockPeek(peeking);
    return { docked: isDocked, peeking: isPeeking, side: dockSide };
  });

  ipcMain.handle("capture:list-sources", (_event, useDemoData?: boolean) => getWindowSources(Boolean(useDemoData)));

  ipcMain.handle("checkpoints:list", () => listCheckpoints());
  ipcMain.handle("checkpoints:save", (_event, checkpoint: CognitiveCheckpoint) => saveCheckpoint(checkpoint));
  ipcMain.handle("checkpoints:delete", (_event, id: string) => deleteCheckpoint(id));
  ipcMain.handle("checkpoints:reset", () => resetCheckpoints());

  ipcMain.handle("resources:open", async (_event, resource: CapturedResource) => {
    if (resource.url) {
      await shell.openExternal(resource.url);
      return { opened: true, mode: "url" };
    }

    return { opened: false, mode: "preview" };
  });

  ipcMain.handle("app:get-version", () => app.getVersion());

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
