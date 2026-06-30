export interface CaptureSource {
  id: string;
  sourceId: string;
  title: string;
  appName?: string;
  thumbnailDataUrl?: string;
  iconDataUrl?: string;
  url?: string;
  isDemo?: boolean;
}

export interface CapturedResource extends CaptureSource {
  selectedAt: string;
}

export interface CaptureResult {
  sources: CaptureSource[];
  permissionDenied: boolean;
  usedDemoData: boolean;
  message?: string;
}

export interface CognitiveCheckpoint {
  id: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  userNote: string;
  goal: string;
  progress: string[];
  currentThinking: string;
  blockers: string[];
  nextMove: string;
  openFirst: string[];
  resources: CapturedResource[];
}
