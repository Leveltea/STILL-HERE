/// <reference types="vite/client" />

import type { SaveMyWorkApi } from "../preload/preload";
import type { CaptureResult, CapturedResource, CognitiveCheckpoint } from "../shared/types";

type RendererApi = Omit<
  SaveMyWorkApi,
  | "listWindowSources"
  | "listCheckpoints"
  | "saveCheckpoint"
  | "deleteCheckpoint"
  | "resetCheckpoints"
  | "openResource"
  | "onDockStateChanged"
  | "setDockPeek"
> & {
  setDockPeek: (peeking: boolean) => Promise<{ docked: boolean; peeking: boolean; side: "left" | "right" }>;
  onDockStateChanged: (callback: (state: { docked: boolean; peeking: boolean; side: "left" | "right" }) => void) => () => void;
  listWindowSources: (useDemoData?: boolean) => Promise<CaptureResult>;
  listCheckpoints: () => Promise<CognitiveCheckpoint[]>;
  saveCheckpoint: (checkpoint: CognitiveCheckpoint) => Promise<CognitiveCheckpoint[]>;
  deleteCheckpoint: (id: string) => Promise<CognitiveCheckpoint[]>;
  resetCheckpoints: () => Promise<CognitiveCheckpoint[]>;
  openResource: (resource: CapturedResource) => Promise<{ opened: boolean; mode: "url" | "preview" }>;
};

declare global {
  interface Window {
    saveMyWork: RendererApi;
  }
}
