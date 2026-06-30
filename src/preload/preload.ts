import { contextBridge, ipcRenderer } from "electron";

const api = {
  setExpanded: (expanded: boolean) => ipcRenderer.invoke("window:set-expanded", expanded),
  setDockPeek: (peeking: boolean) => ipcRenderer.invoke("window:set-dock-peek", peeking),
  onDockStateChanged: (callback: (state: { docked: boolean; peeking: boolean; side: "left" | "right" }) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      state: { docked: boolean; peeking: boolean; side: "left" | "right" }
    ) => callback(state);
    ipcRenderer.on("window:dock-state-changed", listener);
    return () => ipcRenderer.removeListener("window:dock-state-changed", listener);
  },
  listWindowSources: (useDemoData?: boolean) => ipcRenderer.invoke("capture:list-sources", useDemoData),
  listCheckpoints: () => ipcRenderer.invoke("checkpoints:list"),
  saveCheckpoint: (checkpoint: unknown) => ipcRenderer.invoke("checkpoints:save", checkpoint),
  deleteCheckpoint: (id: string) => ipcRenderer.invoke("checkpoints:delete", id),
  resetCheckpoints: () => ipcRenderer.invoke("checkpoints:reset"),
  openResource: (resource: unknown) => ipcRenderer.invoke("resources:open", resource),
  getVersion: () => ipcRenderer.invoke("app:get-version") as Promise<string>
};

contextBridge.exposeInMainWorld("saveMyWork", api);

export type SaveMyWorkApi = typeof api;
